import type { ConstructorType } from "../constructor.type.ts";
import type { Provider } from "./provider.type.ts";

export interface ClassProvider<T> {
  useClass: ConstructorType<T>;
}

export function isClassProvider<T>(
  provider: Provider<T>,
): provider is ClassProvider<T> {
  try {
    return "useClass" in provider;
  } catch {
    return false;
  }
}
