import { TokenNotFoundError } from "./exceptions/TokenNotFoundError";
import { ScopeContext } from "./ScopeContext";
import { ValueProvider } from "./types/providers/ValueProvider";
import { ClassProvider, isClassProvider } from "./types/providers/ClassProvider";
import { FactoryProvider } from "./types/providers/FactoryProvider";
import { getProviderType, isProvider, Provider, ProvidersType } from "./types/providers/Provider";
import { Lifetime, Registration, RegistrationOptions } from "./types/Registration";
import { InjectionToken, isConstructorToken } from "./types/InjectionToken";
import { ConstructorType } from "./types/ConstructorType";
import { IContainer } from "./types/IContainer";
import { STATIC_INJECT_KEY, STATIC_INJECT_LIFETIME } from "./constants";
import { UndefinedScopeError } from "./exceptions/UndefinedScopeError";

class Container implements IContainer {
    private readonly _services: Map<InjectionToken, Registration> = new Map();
    private readonly _scopes: Set<ScopeContext> = new Set();
    private readonly _resolutionStack = new Map<InjectionToken, any>();

    createInstance<T>(implementation: ConstructorType<T>, args: Array<any> = []): T {
        return Reflect.construct(implementation, args);
    }

    async createInstanceAsync<T>(implementation: ConstructorType<T>, args: Array<any> = []): Promise<T> {
        return Reflect.construct(implementation, args);
    }

    private createProxy<T>(token: InjectionToken): T {
        let init = false;
        let value: T;
        const resolvedObject: () => T = () => {
            if (!init) {
                value = container.resolve<T>(token);
                init = true;
            }
            return value;
        };
        const handler: ProxyHandler<any> = {};
        const action = (method: keyof ProxyHandler<any>) => {
            return (...args: Array<any>) => {
                args[0] = resolvedObject();
                const val = (Reflect[method] as any)(...args);
                return typeof val === "function" ? val.bind(resolvedObject()) : val;
            };
        };
        (Object.getOwnPropertyNames(Reflect) as Array<keyof ProxyHandler<any>>).forEach((method) => {
            handler[method] = action(method);
        });
        (Object.getOwnPropertySymbols(Reflect) as unknown as Array<keyof ProxyHandler<any>>).forEach((method) => {
            handler[method] = action(method);
        });
        const proxy = new Proxy<any>({}, handler) as T;
        return proxy;
    }

    /*
        This method uses a normal proxy creation and the normal resolve sync method, 
        because if all goes well all thr instances of the classes should be loaded
        when we try to access the proxy
    */
    private createProxyAsync<T>(token: InjectionToken): T {
        let init = false;
        let value: T;
        const resolvedObject: () => T = () => {
            if (!init) {
                value = container.resolve<T>(token);
                init = true;
            }
            return value;
        };
        const handler: ProxyHandler<any> = {};
        const proxy = new Proxy<any>({}, handler) as T;
        const action = (method: keyof ProxyHandler<any>) => {
            return (...args: Array<any>) => {
                //Trick to avoid infinite recursion
                if (method === "get" && args[1] === "then" && typeof args[0].then === "undefined") {
                    return proxy;
                }
                args[0] = resolvedObject();
                const val = (Reflect[method] as any)(...args);
                return typeof val === "function" ? val.bind(resolvedObject()) : val;
            };
        };
        (Object.getOwnPropertyNames(Reflect) as Array<keyof ProxyHandler<any>>).forEach((method) => {
            handler[method] = action(method);
        });
        (Object.getOwnPropertySymbols(Reflect) as unknown as Array<keyof ProxyHandler<any>>).forEach((method) => {
            handler[method] = action(method);
        });
        return proxy;
    }

    createScope(): ScopeContext {
        const scope = new ScopeContext();
        this._scopes.add(scope);
        return scope;
    }

    disposeScope(scope: ScopeContext): void {
        this._scopes.delete(scope);
    }

    get scopes(): Set<ScopeContext> {
        return this._scopes;
    }

    register<T>(
        token: InjectionToken,
        provider: ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ConstructorType<T>,
        options?: RegistrationOptions,
    ): IContainer {
        let opt: RegistrationOptions = options ? options : { lifetime: Lifetime.Transient };

        let service: Provider<T> = isProvider(provider) ? provider : { useClass: provider };
        let injections = [];

        if (isClassProvider(provider as Provider<T>)) {
            if (
                typeof options === "undefined" &&
                typeof ((provider as ClassProvider<T>).useClass as any)[STATIC_INJECT_LIFETIME] !== "undefined"
            ) {
                opt.lifetime = ((provider as ClassProvider<T>).useClass as any)[STATIC_INJECT_LIFETIME];
            }
            if (typeof ((provider as ClassProvider<T>).useClass as any)[STATIC_INJECT_KEY] !== "undefined") {
                injections = ((provider as ClassProvider<T>).useClass as any)[STATIC_INJECT_KEY];
            }
        }

        this._services.set(token, {
            provider: service,
            providerType: getProviderType(service),
            options: opt,
            injections,
        });
        return this;
    }

    resolve<T>(token: InjectionToken, scope?: ScopeContext): T {
        if (this._resolutionStack.has(token)) {
            //Circular dependency detected, return a proxy
            if (this._resolutionStack.get(token) === null) {
                this._resolutionStack.set(token, this.createProxy<T>(token));
            }
            return this._resolutionStack.get(token);
            //return this.createProxy<T>(token);
        }
        this._resolutionStack.set(token, null);

        try {
            if (!this.hasRegistration(token)) {
                if (isConstructorToken(token)) {
                    const lifetimeAux = (token as any)[STATIC_INJECT_LIFETIME];
                    const lifetime: Lifetime = typeof lifetimeAux !== "undefined" ? lifetimeAux : Lifetime.Transient;
                    let injections = [];
                    if (typeof (token as any)[STATIC_INJECT_KEY] !== "undefined") {
                        injections = (token as any)[STATIC_INJECT_KEY];
                    }
                    const args = this.createArgs({ injections } as Registration<any>, scope);
                    const instance = this.createInstance(token, args);
                    if (lifetime === Lifetime.Scoped) {
                        if (typeof scope === "undefined") {
                            throw new UndefinedScopeError(token);
                        }
                        scope.services.set(token, instance);
                    }
                    this.register(token, { useClass: token }, { lifetime: lifetime });
                    if (lifetime == Lifetime.Singleton) {
                        this.getRegistration(token)!.instance = instance;
                    }
                    return instance;
                }
                throw new TokenNotFoundError(token);
            }

            const registration = this.getRegistration(token)!;

            switch (registration.providerType) {
                case ProvidersType.ConstructorProvider:
                case ProvidersType.ClassProvider:
                    return this.resolveClassProvider(registration, token, scope);
                case ProvidersType.FactoryProvider:
                    return this.resolveFactoryProvider(registration);
                case ProvidersType.ValueProvider:
                    return this.resolveValueProvider(registration);
                default:
                    throw new Error(`Invalid registration type: "${registration.providerType}"`);
            }
        } finally {
            this._resolutionStack.delete(token);
        }
    }

    async resolveAsync<T>(token: InjectionToken, scope?: ScopeContext): Promise<T> {
        if (this._resolutionStack.has(token)) {
            //Circular dependency detected, return a proxy
            if (this._resolutionStack.get(token) === null) {
                this._resolutionStack.set(token, this.createProxyAsync<T>(token));
            }
            return await this._resolutionStack.get(token);
        }
        this._resolutionStack.set(token, null);

        try {
            if (!this.hasRegistration(token)) {
                if (isConstructorToken(token)) {
                    const lifetimeAux = (token as any)[STATIC_INJECT_LIFETIME];
                    const lifetime: Lifetime = typeof lifetimeAux !== "undefined" ? lifetimeAux : Lifetime.Transient;
                    let injections = [];
                    if (typeof (token as any)[STATIC_INJECT_KEY] !== "undefined") {
                        injections = (token as any)[STATIC_INJECT_KEY];
                    }
                    const args = await this.createArgsAsync({ injections } as Registration<any>, scope);
                    const instance = this.createInstance(token, args);
                    if (lifetime === Lifetime.Scoped) {
                        if (typeof scope === "undefined") {
                            throw new UndefinedScopeError(token);
                        }
                        scope.services.set(token, instance);
                    }
                    this.register(token, { useClass: token }, { lifetime: lifetime });
                    if (lifetime == Lifetime.Singleton) {
                        this.getRegistration(token)!.instance = instance;
                    }
                    return instance;
                }
                throw new TokenNotFoundError(token);
            }

            const registration = this.getRegistration(token)!;

            switch (registration.providerType) {
                case ProvidersType.ClassProvider:
                case ProvidersType.ConstructorProvider:
                    return await this.resolveClassProviderAsync(registration, token, scope);
                case ProvidersType.FactoryProvider:
                    return await this.resolveFactoryProviderAsync(registration);
                case ProvidersType.ValueProvider:
                    return this.resolveValueProvider(registration);
                default:
                    throw new Error(`Invalid registration type: "${registration.providerType}"`);
            }
        } finally {
            this._resolutionStack.delete(token);
        }
    }

    private resolveValueProvider<T>(registration: Registration): T {
        return (registration.provider as ValueProvider<T>).useValue;
    }
    private resolveFactoryProvider<T>(registration: Registration): T {
        return (registration.provider as FactoryProvider<T>).useFactory(this);
    }
    private async resolveFactoryProviderAsync<T>(registration: Registration): Promise<T> {
        return (registration.provider as FactoryProvider<T>).useFactory(this);
    }
    private resolveClassProvider<T>(registration: Registration, token: InjectionToken, scope?: ScopeContext): T {
        const args = this.createArgs(registration, scope);
        if (registration.options.lifetime === Lifetime.Scoped) {
            if (typeof scope === "undefined") {
                throw new UndefinedScopeError(token);
            }
            if (!scope.services.has(token)) {
                scope.services.set(
                    token,
                    this.createInstance((registration.provider as ClassProvider<T>).useClass, args),
                );
            }
            return scope.services.get(token)!;
        }
        if (registration.options.lifetime === Lifetime.Singleton) {
            if (typeof registration.instance === "undefined") {
                registration.instance = this.createInstance((registration.provider as ClassProvider<T>).useClass, args);
            }
            return registration.instance;
        }
        return this.createInstance((registration.provider as ClassProvider<T>).useClass, args);
    }

    private async resolveClassProviderAsync<T>(
        registration: Registration,
        token: InjectionToken,
        scope?: ScopeContext,
    ): Promise<T> {
        const args = await this.createArgsAsync(registration, scope);
        if (registration.options.lifetime === Lifetime.Scoped) {
            if (typeof scope === "undefined") {
                throw new UndefinedScopeError(token);
            }
            if (!scope.services.has(token)) {
                scope.services.set(
                    token,
                    await this.createInstanceAsync((registration.provider as ClassProvider<T>).useClass, args),
                );
            }
            return scope.services.get(token)!;
        }
        if (registration.options.lifetime === Lifetime.Singleton) {
            if (typeof registration.instance === "undefined") {
                registration.instance = await this.createInstanceAsync(
                    (registration.provider as ClassProvider<T>).useClass,
                    args,
                );
            }
            return registration.instance;
        }
        return await this.createInstanceAsync((registration.provider as ClassProvider<T>).useClass, args);
    }

    private createArgs(registration: Registration, scope?: ScopeContext): Array<unknown> {
        return registration.injections.map((token) => this.resolve(token, scope));
    }
    private async createArgsAsync(registration: Registration, scope?: ScopeContext): Promise<Array<unknown>> {
        const args = [];
        for (const token of registration.injections) {
            args.push(await this.resolveAsync(token, scope));
        }
        return args;
    }

    hasRegistration(token: InjectionToken): boolean {
        return this._services.has(token);
    }
    getRegistration(token: InjectionToken): Registration | undefined {
        return this._services.get(token)!;
    }
    reset(): void {
        this._services.clear();
        this._scopes.clear();
    }
}

export const container = new Container();
