import { InjectionToken } from "../InjectionToken";
import { Provider } from "./Provider";


export interface TokenProvider<T> {
    useToken: InjectionToken<T>;
}


export function isTokenProvider<T>(provider: Provider<T>): provider is TokenProvider<T> {
    return typeof (provider as TokenProvider<T>).useToken !== "undefined";
}