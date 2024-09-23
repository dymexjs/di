import { ConstructorType } from "../constructor.type";
import { Provider } from "./provider.type";

export interface ClassProvider<T> {
  useClass: ConstructorType<T>;
}

export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
  return !!(provider as ClassProvider<T>).useClass;
}
