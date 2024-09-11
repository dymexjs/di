import { TokenNotFoundError } from "./exceptions/TokenNotFoundError";
import { UndefinedScopeError } from "./exceptions/UndefinedScopeError";
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
    

    register<T>(
        token: InjectionToken,
        provider: ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ConstructorType<T>,
        options?: RegistrationOptions,
    ): IContainer {
        
        let opt: RegistrationOptions = options ? options : { lifetime: Lifetime.Transient };

        let service: Provider<T> = isProvider(provider) ? provider : { useClass: provider };
        
        if(isClassProvider(provider as Provider<T>) && typeof options === "undefined") {
            if((provider as any)[STATIC_INJECT_LIFETIME]) {
                opt.lifetime = (provider as any)[STATIC_INJECT_LIFETIME];
            }
        }

        this._services.set(token, { provider: service, providerType: getProviderType(service), options: opt });
        return this;
    }

    resolve<T>(token: InjectionToken, scope?: ScopeContext): T {
        if (!this.hasRegistration(token)) {
            if (isConstructorToken(token)) {
                const instance = this.createInstance(token);
                const lifetime: Lifetime = (token as any)[STATIC_INJECT_LIFETIME] ? (token as any)[STATIC_INJECT_LIFETIME] : Lifetime.Transient;
                this.register(token, { useClass: token }, { lifetime: lifetime });
                return instance;
            }
            throw new TokenNotFoundError(token);
        }
        const registration = this.getRegistration(token)!;

        switch (registration.providerType) {
            case ProvidersType.ClassProvider:
                if(registration.options.lifetime===Lifetime.Scoped) {
                    if(typeof scope === "undefined") {
                        throw new UndefinedScopeError(token);
                    }
                    if (!scope.services.has(token)) {
                        scope.services.set(
                            token,
                            this.createInstance((registration.provider as ClassProvider<T>).useClass),
                        );
                    }
                    return scope.services.get(token)!;
                }
                if(registration.options.lifetime===Lifetime.Singleton) {
                    if(typeof registration.intance === "undefined") {
                        registration.intance = new (registration.provider as ClassProvider<T>).useClass();
                    }
                    return registration.intance;
                }
                return new (registration.provider as ClassProvider<T>).useClass();
            case ProvidersType.FactoryProvider:
                return (registration.provider as FactoryProvider<T>).useFactory(this);
            case ProvidersType.ValueProvider:
                return (registration.provider as ValueProvider<T>).useValue;
            default:
                throw new Error(`Invalid registration type: "${registration.providerType}"`);
        }
    }
    hasRegistration(token: InjectionToken): boolean {
        return this._services.has(token);
    }
    getRegistration(token: InjectionToken): Registration | undefined {
        if (this._services.has(token)) {
            return this._services.get(token)!;
        }
    }
    reset(): void {
        this._services.clear();
    }
    staticInject<T>(ctor: ConstructorType<T>): T {
        return new ctor(...this.resolveStaticTokens((ctor as any)[STATIC_INJECT_KEY]));
    }
    private resolveStaticTokens(tokens: Array<InjectionToken>): Array<any> {
        return tokens.map((token) => this.resolve(token));
    }
}

export const container = new Container();
