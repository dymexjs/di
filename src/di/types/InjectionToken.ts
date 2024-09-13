import { ConstructorType } from "./ConstructorType";



export type InjectionToken<T = any> = string | symbol | ConstructorType<T>;


export function isNormalToken(token?: InjectionToken): token is string | symbol {
    return typeof token === "string" || typeof token === "symbol";
}