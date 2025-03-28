import type { Provider } from "./provider.type.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FactoryFunction<T> = (...arguments_: Array<any>) => Promise<T> | T;

export interface FactoryProvider<T> {
  useFactory: FactoryFunction<T>;
}

export function isFactoryProvider<T>(
  provider: Provider<T>,
): provider is FactoryProvider<T> {
  try {
    return "useFactory" in provider;
  } catch {
    return false;
  }
}
