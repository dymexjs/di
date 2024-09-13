import { isValueProvider, ValueProvider } from "./ValueProvider";
import { ClassProvider, isClassProvider } from "./ClassProvider";
import { FactoryProvider, isFactoryProvider } from "./FactoryProvider";
import { isTokenProvider, TokenProvider } from "./TokenProvider";
import { isConstructorType } from "../ConstructorType";


export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | TokenProvider<T>;


export enum ProvidersType {
    ValueProvider,
    ClassProvider,
    FactoryProvider,
    ConstructorProvider,
    TokenProvider
}


export function isProvider<T>(provider: any): provider is Provider {
    return isClassProvider(provider) || isValueProvider(provider) || isFactoryProvider(provider) || isTokenProvider(provider);
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
    if(isConstructorType(provider)) {
        return ProvidersType.ConstructorProvider;
    }
    if(isTokenProvider(provider)) {
        return ProvidersType.TokenProvider;
    }
    throw new Error(`Invalid provider type: ${provider}`);
}
