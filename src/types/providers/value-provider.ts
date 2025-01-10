import type { Provider } from "./provider.type.ts";

export interface ValueProvider<T> {
  useValue: T;
}

export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return "useValue" in provider;
}
