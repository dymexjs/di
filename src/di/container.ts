import { TokenNotFoundError } from "./exceptions/TokenNotFoundError";
import {
    ClassProvider,
    FactoryProvider,
    getProviderType,
    IContainer,
    InjectionToken,
    Lifetime,
    Registration,
    ValueProvider,
    RegistrationOptions,
    ProvidersType,
    isProvider,
    Provider,
    ConstructorType,
    isConstructorToken,
    STATIC_INJECT_LIFETIME,
    STATIC_INJECT_KEY,
    isClassProvider,
    ScopeContext,
} from "./types";

class Container implements IContainer {
    private readonly _services: Map<InjectionToken, Registration> = new Map();
    private readonly _scopes: Set<ScopeContext> = new Set();

    createInstance<T>(implementation: ConstructorType<T>): T {
        return new implementation();
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
        
        if(isClassProvider(provider as Provider<T>) && typeof options === "undefined") {
            if(typeof ((provider as ClassProvider<T>).useClass as any)[STATIC_INJECT_LIFETIME] !== "undefined") {
                opt.lifetime = ((provider as ClassProvider<T>).useClass as any)[STATIC_INJECT_LIFETIME];
            }
        }

        this._services.set(token, { provider: service, providerType: getProviderType(service), options: opt });
        return this;
    }

    resolve<T>(token: InjectionToken, scope: ScopeContext = new ScopeContext()): T {

        if (!this.hasRegistration(token)) {
            if (isConstructorToken(token)) {
                const lifetimeAux = (token as any)[STATIC_INJECT_LIFETIME];
                const lifetime: Lifetime = typeof lifetimeAux !== "undefined" ? lifetimeAux : Lifetime.Transient;
                const instance = this.createInstance(token);
                if(lifetime === Lifetime.Scoped) {                    
                    scope.services.set(token, instance);
                }
                this.register(token, { useClass: token }, { lifetime: lifetime });
                if(lifetime == Lifetime.Singleton) {
                    this.getRegistration(token)!.instance = instance;
                }
                return instance;
            }
            throw new TokenNotFoundError(token);
        }

        const registration = this.getRegistration(token)!;

        switch (registration.providerType) {
            case ProvidersType.ClassProvider:
                return this.resolveClassProvider(registration, token, scope);
            case ProvidersType.FactoryProvider:
                return this.resolveFactoryProvider(registration);
            case ProvidersType.ValueProvider:
                return this.resolveValueProvider(registration);
            case ProvidersType.ConstructorProvider:
                return this.resolveClassProvider(registration, token, scope);
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
    private resolveClassProvider<T>(registration: Registration, token: InjectionToken, scope: ScopeContext): T {
        if(registration.options.lifetime===Lifetime.Scoped) {
            if (!scope.services.has(token)) {
                scope.services.set(
                    token,
                    this.createInstance((registration.provider as ClassProvider<T>).useClass),
                );
            }
            return scope.services.get(token)!;
        }
        if(registration.options.lifetime===Lifetime.Singleton) {
            if(typeof registration.instance === "undefined") {
                registration.instance = this.createInstance((registration.provider as ClassProvider<T>).useClass);
            }
            return registration.instance;
        }
        return this.createInstance((registration.provider as ClassProvider<T>).useClass);
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
    staticInject<T>(ctor: ConstructorType<T>): T {
        return new ctor(...this.resolveStaticTokens((ctor as any)[STATIC_INJECT_KEY]));
    }
    private resolveStaticTokens(tokens: Array<InjectionToken>): Array<any> {
        return tokens.map((token) => this.resolve(token));
    }
}

export const container = new Container();
