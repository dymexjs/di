import type { IContainer } from "../container.interface.ts";
import type { Provider } from "./provider.type.ts";

export type FactoryFunction<T> = (container: IContainer) => T | Promise<T>;

export interface FactoryProvider<T> {
  useFactory: FactoryFunction<T>;
}

export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
  return "useFactory" in provider;
}
