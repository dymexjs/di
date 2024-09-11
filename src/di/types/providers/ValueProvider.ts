import { Provider } from "./Provider";


export interface ValueProvider<T> {
    useValue: T;
}


export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
    return typeof (provider as ValueProvider<T>).useValue !== "undefined";
}