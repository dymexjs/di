import { isConstructorType } from "../constructor.type.ts";
import { type ClassProvider, isClassProvider } from "./class-provider.ts";
import { type FactoryProvider, isFactoryProvider } from "./factory-provider.ts";
import { isTokenProvider, type TokenProvider } from "./token-provider.ts";
import { isValueProvider, type ValueProvider } from "./value-provider.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Provider<T = any> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | TokenProvider<T>
  | ValueProvider<T>;

export const ProvidersType = {
  ClassProvider: "ClassProvider",
  ConstructorProvider: "ConstructorProvider",
  FactoryProvider: "FactoryProvider",
  TokenProvider: "TokenProvider",
  ValueProvider: "ValueProvider",
} as const;

export type ProvidersType = keyof typeof ProvidersType;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isProvider(provider: any): provider is Provider {
  return (
    isClassProvider(provider) ||
    isValueProvider(provider) ||
    isFactoryProvider(provider) ||
    isTokenProvider(provider)
  );
}
