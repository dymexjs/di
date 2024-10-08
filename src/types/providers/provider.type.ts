import { isValueProvider, ValueProvider } from "./value-provider";
import { ClassProvider, isClassProvider } from "./class-provider";
import { FactoryProvider, isFactoryProvider } from "./factory-provider";
import { isTokenProvider, TokenProvider } from "./token-provider";
import { isConstructorType } from "../constructor.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Provider<T = any> =
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | TokenProvider<T>;

export enum ProvidersType {
  ValueProvider,
  ClassProvider,
  FactoryProvider,
  ConstructorProvider,
  TokenProvider,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isProvider(provider: any): provider is Provider {
  return (
    isClassProvider(provider) ||
    isValueProvider(provider) ||
    isFactoryProvider(provider) ||
    isTokenProvider(provider)
  );
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
  if (isConstructorType(provider)) {
    return ProvidersType.ConstructorProvider;
  }
  if (isTokenProvider(provider)) {
    return ProvidersType.TokenProvider;
  }
  throw new Error(`Invalid provider type: ${provider}`);
}
