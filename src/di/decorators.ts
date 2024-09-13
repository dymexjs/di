import { container } from "./container";
import { InterfaceId, UnwrapInjectionTokens, UnwrapInterfaceIds } from "./types/decorators";
import { InjectionToken } from "./types/InjectionToken";
import { ProvidersType } from "./types/providers/Provider";
import { Lifetime, Registration } from "./types/Registration";


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
            container.registerInterfaceId(id, target);
            container.registerRegistration(target, reg);
            return;
        }
        throw new Error("Injectable decorator can only be used on a class.");
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
            container.registerInterfaceId(id, target);
            container.registerRegistration(target, reg);
            return;
        }
        throw new Error("Injectable decorator can only be used on a class.");
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
