import { isValueProvider, ValueProvider } from "./ValueProvider";
import { ClassProvider, isClassProvider } from "./ClassProvider";
import { FactoryProvider, isFactoryProvider } from "./FactoryProvider";
import { isConstructorToken } from "../InjectionToken";


export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;


export enum ProvidersType {
    ValueProvider,
    ClassProvider,
    FactoryProvider,
    ConstructorProvider
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
