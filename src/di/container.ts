import { TokenNotFoundError } from "./exceptions/TokenNotFoundError";
import { ScopeContext } from "./scope-context";
import { ValueProvider } from "./types/providers/value-provider";
import { ClassProvider, isClassProvider } from "./types/providers/class-provider";
import { FactoryProvider } from "./types/providers/factory-provider";
import { getProviderType, isProvider, Provider, ProvidersType } from './types/providers/provider';
import { Lifetime, Registration, RegistrationOptions } from "./types/registration";
import { InjectionToken } from "./types/injection-token";
import { ConstructorType, isConstructorType } from "./types/constructor.type";
import { IContainer } from "./types/container.interface";
import { STATIC_INJECT_KEY, STATIC_INJECT_LIFETIME } from "./constants";
import { UndefinedScopeError } from "./exceptions/UndefinedScopeError";
import { isTokenProvider, TokenProvider } from "./types/providers/token-provider";
import { TokenRegistrationCycleError } from "./exceptions/TokenRegistrationCycleError";
import { ServiceMap } from "./service-map";

export class Container implements IContainer {
    private readonly _services: ServiceMap<InjectionToken, Registration> = new ServiceMap();
    private readonly _scopes: Set<ScopeContext> = new Set();
    private readonly _resolutionStack = new Map<InjectionToken, any>();
    private _childContainer?: IContainer;

    constructor(private readonly _parent?: IContainer) {}

    createInstance<T>(implementation: ConstructorType<T>, args: Array<any> = []): T {
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
                //Trick because of promises - await will fire Promise.then() in the proxy
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

    private inspectCircularTokenProvider<T>(token: InjectionToken<T>, provider: TokenProvider<T>): void {
        const path = [token];
        let tokenProvider: TokenProvider<T> | null = provider;
        while (tokenProvider !== null) {
            const current = tokenProvider.useToken;
            if (path.includes(current)) {
                throw new TokenRegistrationCycleError([...path, current]);
            }
            path.push(current);
            const registation = this.getRegistration(current);
            if (registation && isTokenProvider<T>(registation.provider)) {
                tokenProvider = registation.provider;
            } else {
                tokenProvider = null;
            }
        }
    }

    register<T>(
        token: InjectionToken,
        provider: Provider<T> | ConstructorType<T>,
        options?: RegistrationOptions,
    ): IContainer {
        let opt: RegistrationOptions = options ? options : { lifetime: Lifetime.Transient };

        let service: Provider<T> = isProvider(provider) ? provider : { useClass: provider };

        if (isTokenProvider(service)) {
            this.inspectCircularTokenProvider(token, service);
        }

        let injections = [];

        if (isClassProvider(service as Provider<T>)) {
            if (
                typeof options === "undefined" &&
                typeof ((service as ClassProvider<T>).useClass as any)[STATIC_INJECT_LIFETIME] !== "undefined"
            ) {
                opt.lifetime = ((service as ClassProvider<T>).useClass as any)[STATIC_INJECT_LIFETIME];
            }
            if (typeof ((service as ClassProvider<T>).useClass as any)[STATIC_INJECT_KEY] !== "undefined") {
                injections = ((service as ClassProvider<T>).useClass as any)[STATIC_INJECT_KEY];
            }
        }

        return this.registerRegistration(token, {
            provider: service,
            providerType: getProviderType(service),
            options: opt,
            injections,
        });
    }

    registerRegistration(token: InjectionToken, registration: Registration<any>): IContainer {
        this._services.set(token, registration);
        return this;
    }

    registerInstance<T>(token: InjectionToken, instance: T): IContainer {
        this._services.set(token, {
            provider: { useValue: instance },
            providerType: ProvidersType.ValueProvider,
            options: { lifetime: Lifetime.Singleton },
            injections: [],
        });
        return this;
    }

    registerType<T>(from: InjectionToken, to: InjectionToken<T> | TokenProvider<T>): IContainer {
        if (isTokenProvider(to as Provider<T>)) {
            return this.register(from, to as TokenProvider<T>);
        }
        if (isConstructorType(to)) {
            return this.register(from, { useClass: to });
        }

        return this.register(from, { useToken: to as InjectionToken<T> });
    }

    resolve<T>(token: InjectionToken, scope?: ScopeContext): T {
        if (this._resolutionStack.has(token)) {
            //Circular dependency detected, return a proxy
            if (this._resolutionStack.get(token) === null) {
                this._resolutionStack.set(token, this.createProxy<T>(token));
            }
            return this._resolutionStack.get(token);
        }
        this._resolutionStack.set(token, null);

        try {
            if (!this.hasRegistration(token)) {
                if (isConstructorType(token)) {
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
            return this.resolveRegistration(token, registration, scope);
        } finally {
            this._resolutionStack.delete(token);
        }
    }

    resolveRegistration<T>(token: InjectionToken, registration: Registration<T>, scope?: ScopeContext): T {
        switch (registration.providerType) {
            case ProvidersType.ConstructorProvider:
            case ProvidersType.ClassProvider:
                return this.resolveClassProvider(registration, token, scope);
            case ProvidersType.FactoryProvider:
                return this.resolveFactoryProvider(registration);
            case ProvidersType.ValueProvider:
                return this.resolveValueProvider(registration);
            case ProvidersType.TokenProvider:
                return this.resolve(registration.provider.useToken, scope);
            default:
                throw new Error(`Invalid registration type: "${registration.providerType}"`);
        }
    }

    resolveAll<T>(token: InjectionToken, scope?: ScopeContext): Array<T> {
        if (!this.hasRegistration(token)) {
            if (isConstructorType(token)) {
                return [this.resolve(token, scope)];
            }
            throw new TokenNotFoundError(token);
        }
        const registrations = this.getAllRegistrations(token);
        return registrations.map((registration) => this.resolveRegistration(token, registration, scope));
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
                if (isConstructorType(token)) {
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
            return await this.resolveRegistrationAsync(token, registration, scope);
        } finally {
            this._resolutionStack.delete(token);
        }
    }
    async resolveAllAsync<T>(token: InjectionToken, scope?: ScopeContext): Promise<Array<T>> {
        if (!this.hasRegistration(token)) {
            if (isConstructorType(token)) {
                return [await this.resolveAsync(token, scope)];
            }
            throw new TokenNotFoundError(token);
        }
        const registrations = this.getAllRegistrations(token);
        const result = [];
        for (const registration of registrations) {
            result.push(await this.resolveRegistrationAsync<T>(token, registration, scope));
        }
        return result;
    }

    private async resolveRegistrationAsync<T>(
        token: InjectionToken,
        registration: Registration,
        scope?: ScopeContext,
    ): Promise<T> {
        switch (registration.providerType) {
            case ProvidersType.ClassProvider:
            case ProvidersType.ConstructorProvider:
                return await this.resolveClassProviderAsync(registration, token, scope);
            case ProvidersType.FactoryProvider:
                return await this.resolveFactoryProviderAsync(registration);
            case ProvidersType.ValueProvider:
                return await this.resolveValueProvider(registration);
            case ProvidersType.TokenProvider:
                return await this.resolveAsync(registration.provider.useToken, scope);
            default:
                throw new Error(`Invalid registration type: "${registration.providerType}"`);
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
        if (registration.options.lifetime === Lifetime.Scoped) {
            if (typeof scope === "undefined") {
                throw new UndefinedScopeError(token);
            }
            if (!scope.services.has(token)) {
                scope.services.set(
                    token,
                    this.createInstance(
                        (registration.provider as ClassProvider<T>).useClass,
                        this.createArgs(registration, scope),
                    ),
                );
            }
            return scope.services.get(token)!;
        }
        if (registration.options.lifetime === Lifetime.Singleton) {
            if (typeof registration.instance === "undefined") {
                registration.instance = this.createInstance(
                    (registration.provider as ClassProvider<T>).useClass,
                    this.createArgs(registration, scope),
                );
            }
            return registration.instance;
        }
        return this.createInstance(
            (registration.provider as ClassProvider<T>).useClass,
            this.createArgs(registration, scope),
        );
    }

    private async resolveClassProviderAsync<T>(
        registration: Registration,
        token: InjectionToken,
        scope?: ScopeContext,
    ): Promise<T> {
        if (registration.options.lifetime === Lifetime.Scoped) {
            if (typeof scope === "undefined") {
                throw new UndefinedScopeError(token);
            }
            if (!scope.services.has(token)) {
                scope.services.set(
                    token,
                    this.createInstance(
                        (registration.provider as ClassProvider<T>).useClass,
                        await this.createArgsAsync(registration, scope),
                    ),
                );
            }
            return scope.services.get(token)!;
        }
        if (registration.options.lifetime === Lifetime.Singleton) {
            if (typeof registration.instance === "undefined") {
                registration.instance = this.createInstance(
                    (registration.provider as ClassProvider<T>).useClass,
                    await this.createArgsAsync(registration, scope),
                );
            }
            return registration.instance;
        }
        return this.createInstance(
            (registration.provider as ClassProvider<T>).useClass,
            await this.createArgsAsync(registration, scope),
        );
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
        if (this._services.has(token)) {
            return true;
        }
        if (typeof this._parent !== "undefined") {
            return this._parent.hasRegistration(token, true);
        }
        return false;
    }
    getRegistration(token: InjectionToken): Registration | undefined {
        if (this._services.get(token)) {
            return this._services.get(token);
        }

        if (typeof this._parent !== "undefined") {
            return this._parent.getRegistration(token, true);
        }
    }
    reset(): void {
        this._services.clear();
        this._scopes.clear();
    }

    getAllRegistrations<T>(token: InjectionToken<T>): Array<Registration> {
        if (this._services.getAll(token).length > 0) {
            return this._services.getAll(token);
        }
        if (this._parent) {
            return this._parent.getAllRegistrations(token);
        }
        return [];
    }

    clearInstances(): void {
        for (const [token, registrations] of this._services.entries()) {
            registrations
                .filter((x) => x.providerType !== ProvidersType.ValueProvider)
                .map((registration) => {
                    registration.instance = undefined;
                });
        }
    }

    createChildContainer(): IContainer {
        const childContainer = new Container(this);
        //Saves child container for disponse from main container
        this._childContainer = childContainer;
        return childContainer;
    }
}

export const container: IContainer = new Container();
