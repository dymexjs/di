import { ConstructorType } from "./ConstructorType";



export type InjectionToken<T = any> = string | symbol | ConstructorType<T>;

export function isConstructorToken(token?: InjectionToken<any>): token is ConstructorType<any> {
    return typeof token === "function";
}
