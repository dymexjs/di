import { IContainer } from "../IContainer";
import { Provider } from "./provider";

export interface FactoryProvider<T> {
    useFactory: (container: IContainer) => T;
}

export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
    return !!(provider as FactoryProvider<T>).useFactory;
}