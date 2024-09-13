import { container } from "../../container";
import { InjectionToken } from "../InjectionToken";
import { ProvidersType } from "../providers/Provider";
import { Lifetime, Registration } from "../Registration";

type UnwrapInjectionTokens<T extends InjectionToken[]> = {
    [K in keyof T]: T[K] extends string ? any : T[K] extends InjectionToken<infer U> ? U : never
}

export function Singleton<I, TDependencies extends Array<InjectionToken>>(dependencies?: [...TDependencies], token?: InjectionToken<I>){
    return function <T extends { new ( ...args: UnwrapInjectionTokens<TDependencies>): I }>(target: T, {kind}: ClassDecoratorContext){
        if(kind === "class") {
            container.registerRegistration(token ?? target, createRegistration(target, Lifetime.Singleton, dependencies || []));
            return;
        }
        throw new Error('Singleton decorator can only be used on a class.');
    }
}

export function Transient<I, TDependencies extends Array<InjectionToken>>(dependencies?: [...TDependencies], token?: InjectionToken<I>){
    return function <T extends { new ( ...args: UnwrapInjectionTokens<TDependencies>): I }>(target: T, {kind}: ClassDecoratorContext){
        if(kind === "class") {
            container.registerRegistration(token ?? target, createRegistration(target, Lifetime.Transient, dependencies || []));
            return;
        }
        throw new Error('Transient decorator can only be used on a class.');
    }
}

function createRegistration<T>(target: T, lifetime: Lifetime, dependencies: Array<InjectionToken>): Registration {
    return {
        provider: { useClass: target},
        providerType: ProvidersType.ClassProvider,
        options: { lifetime: lifetime },
        injections: dependencies
    }
}