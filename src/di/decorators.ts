import { container } from "./container";
import { InvalidDecoratorError } from "./exceptions/InvalidDecoratorError";
import { InterfaceId, UnwrapInjectionTokens, UnwrapInterfaceIds } from "./types/decorators";
import { InjectionToken } from "./types/injection-token";
import { ProvidersType } from "./types/providers/provider";
import { Lifetime, Registration } from "./types/registration";


const getRandomString = () => Math.random().toString(36).substring(2, 15);

/**
 * Creates a runtime identifier of an interface used for dependency injection.
 *
 * Every call to this function produces unique identifier, you can't call this method twice for the same Type!
 */
export const createInterfaceId = <T>(id: string): InterfaceId<T> => `${id}-${getRandomString()}` as InterfaceId<T>;

export function Singleton<I, TDependencies extends Array<InjectionToken>>(dependencies?: [...TDependencies], token?: InjectionToken<I>){
    return function <T extends { new ( ...args: UnwrapInjectionTokens<TDependencies>): I }>(target: T, {kind}: ClassDecoratorContext){
        if(kind === "class") {
            container.registerRegistration(target, createRegistration(target, Lifetime.Singleton, dependencies || []));
            if(typeof token !== undefined) {
                container.registerType<I>(token!, { useToken: target});
            }
            return;
        }
        throw new InvalidDecoratorError("Singleton",target);
    }
}

export function Transient<I, TDependencies extends Array<InjectionToken>>(dependencies?: [...TDependencies], token?: InjectionToken<I>){
    return function <T extends { new ( ...args: UnwrapInjectionTokens<TDependencies>): I }>(target: T, {kind}: ClassDecoratorContext){
        if(kind === "class") {
            container.registerRegistration(target, createRegistration(target, Lifetime.Transient, dependencies || []));
            if(typeof token !== undefined) {
                container.registerType<I>(token!, { useToken: target});
            }
            return;
        }
        throw new InvalidDecoratorError("Transient",target);
    }
}

export function Scoped<I, TDependencies extends Array<InjectionToken>>(dependencies?: [...TDependencies], token?: InjectionToken<I>){
    return function <T extends { new ( ...args: UnwrapInjectionTokens<TDependencies>): I }>(target: T, {kind}: ClassDecoratorContext){
        if(kind === "class") {
            container.registerRegistration(target, createRegistration(target, Lifetime.Scoped, dependencies || []));
            if(typeof token !== undefined) {
                container.registerType<I>(token!, { useToken: target});
            }
            return;
        }
        throw new InvalidDecoratorError("Scoped",target);
    }
}




export function SingletonInterface<I, TDependencies extends Array<InterfaceId<unknown> | InjectionToken<unknown>>>(
    id: InterfaceId<I>,
    dependencies: [...TDependencies] | [] = [],
) {
    return function <T extends { new (...args: UnwrapInterfaceIds<TDependencies>): I }>(
        target: T,
        { kind }: ClassDecoratorContext,
    ) {
        if (kind === "class") {
            const reg = createRegistration(target, Lifetime.Singleton, dependencies);
            container.registerRegistration(target, reg);
            container.registerType(id, {useToken: target});
            return;
        }
        throw new InvalidDecoratorError("SingletonInterface",target);
    };
}
export function TransientInterface<I, TDependencies extends Array<InterfaceId<unknown> | InjectionToken<unknown>>>(
    id: InterfaceId<I>,
    dependencies: [...TDependencies] | [] = [],
) {
    return function <T extends { new (...args: UnwrapInterfaceIds<TDependencies>): I }>(
        target: T,
        { kind }: ClassDecoratorContext,
    ) {
        if (kind === "class") {
            const reg = createRegistration(target, Lifetime.Transient, dependencies);
            container.registerRegistration(target, reg);
            container.registerType(id, {useToken: target});
            return;
        }
        throw new InvalidDecoratorError("TransientInterface",target);
    };
}

export function ScopedInterface<I, TDependencies extends Array<InterfaceId<unknown> | InjectionToken<unknown>>>(
    id: InterfaceId<I>,
    dependencies: [...TDependencies] | [] = [],
) {
    return function <T extends { new (...args: UnwrapInterfaceIds<TDependencies>): I }>(
        target: T,
        { kind }: ClassDecoratorContext,
    ) {
        if (kind === "class") {
            const reg = createRegistration(target, Lifetime.Scoped, dependencies);
            container.registerRegistration(target, reg);
            container.registerType(id, {useToken: target});
            return;
        }
        throw new InvalidDecoratorError("ScopedInterface",target);
    };
}

function createRegistration<T>(
    target: T,
    lifetime: Lifetime,
    dependencies: Array<InjectionToken<unknown>>,
): Registration {
    return {
        provider: { useClass: target },
        providerType: ProvidersType.ClassProvider,
        options: { lifetime: lifetime },
        injections: dependencies,
    };
}
