export interface IContainer {
    createInstance<T>(implementation: ConstructorType<T>): T;
    getRegistration(token: InjectionToken): Registration | undefined;
    hasRegistration(token: InjectionToken): boolean;
    register<T>(
        token: InjectionToken,
        provider: ValueProvider<T> | ClassProvider<T> | FactoryProvider<T> | ConstructorType<T>,
        options?: RegistrationOptions,
    ): IContainer;
    resolve<T>(token: InjectionToken): T;
    reset(): void;
    staticInject<T>(ctor: ConstructorType<T>): T;
}
export type ConstructorType<T> = new (...args: Array<any>) => T;

export function isConstructorToken(token?: InjectionToken<any>): token is ConstructorType<any> {
    return typeof token === "function";
}


export type InjectionToken<T = any> = string | symbol | ConstructorType<T>;

export const STATIC_INJECT_KEY = Symbol("STATIC_INJECT_KEY");
export const STATIC_INJECT_LIFETIME = Symbol("STATIC_INJECT_LIFETIME");

export interface Registration<T = any> {
    providerType: ProvidersType;
    provider: any;
    instance?: T;
    options: RegistrationOptions;
}

export enum Lifetime {
    Singleton,
    Transient,
    Scoped,
}

export type RegistrationOptions = {
    lifetime: Lifetime;
};

export enum ProvidersType {
    ValueProvider,
    ClassProvider,
    FactoryProvider,
    ConstructorProvider
}

export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;

export interface FactoryProvider<T> {
    useFactory: (container: IContainer) => T;
}
export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
    return !!(provider as FactoryProvider<T>).useFactory;
}

export interface ClassProvider<T> {
    useClass: ConstructorType<T>;
}
export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
    return !!(provider as ClassProvider<T>).useClass;
}

export interface ValueProvider<T> {
    useValue: T;
}
export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
    return typeof (provider as ValueProvider<T>).useValue !== "undefined";
}

export function isProvider<T>(provider: any): provider is Provider {
    return isClassProvider(provider) || isValueProvider(provider) || isFactoryProvider(provider);
}

export function getProviderType(provider: Provider): ProvidersType {
    if (isValueProvider(provider)) {
        return ProvidersType.ValueProvider;
    }
    if (isClassProvider(provider)) {
        return ProvidersType.ClassProvider;
    }
    if (isFactoryProvider(provider)) {
        return ProvidersType.FactoryProvider;
    }
    if(isConstructorToken(provider)) {
        return ProvidersType.ConstructorProvider;
    }
    throw new Error(`Invalid provider type: ${provider}`);
}


export class ScopeContext {
    private readonly _services: Map<InjectionToken,any> = new Map();
    get services(): Map<InjectionToken,any> {
        return this._services;
    }
}