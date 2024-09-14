import { InjectionToken } from "./injection-token";

export type UnwrapInjectionTokens<T extends InjectionToken[]> = {
    [K in keyof T]: T[K] extends string ? any : T[K] extends InjectionToken<infer U> ? U : never
}

export type InterfaceId<T = any> = string & { __type: T };


export type UnwrapInterfaceIds<T extends Array<InterfaceId<unknown> | InjectionToken<unknown>>> = {
    [K in keyof T]: T[K] extends InterfaceId<infer U> ? U : T[K] extends InjectionToken<infer U> ? U : never;
};
