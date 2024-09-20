import { container } from "./container";
import { InvalidDecoratorError } from "./exceptions/InvalidDecoratorError";
import { ConstructorType } from "./types/constructor.type";
import { InterfaceId, UnwrapDecoratorArgs } from "./types/decorators";
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

export function Singleton<TDependencies extends Array<InjectionToken | InterfaceId>, I = any>(
    id?: TDependencies extends Array<InterfaceId>
        ? InjectionToken | InterfaceId<I>
        : [...TDependencies] | InjectionToken | InterfaceId<I>,
    dependencies?: [...TDependencies],
) {
    return function <T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I }>(
        target: T,
        { kind }: ClassDecoratorContext,
    ) {
        if (kind === "class") {
            let token: InjectionToken<I> = target;
            if (Array.isArray(id)) {
                dependencies = id as unknown as [...TDependencies];
            } else {
                if (typeof id !== "undefined") {
                    token = id as unknown as InjectionToken<I>;
                }
            }
            container.registerRegistration(target, createRegistration(target, Lifetime.Singleton, dependencies || []));
            if (token !== target) {
                container.registerType(token, { useToken: target });
            }
            return;
        }
        throw new InvalidDecoratorError("Singleton", target);
    };
}

export function Transient<TDependencies extends Array<InjectionToken | InterfaceId>, I = any>(
    id?: TDependencies extends Array<InterfaceId>
        ? InjectionToken | InterfaceId<I>
        : [...TDependencies] | InjectionToken | InterfaceId<I>,
    dependencies?: [...TDependencies],
) {
    return function <T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I }>(
        target: T,
        { kind }: ClassDecoratorContext,
    ) {
        if (kind === "class") {
            let token: InjectionToken<I> = target;
            if (Array.isArray(id)) {
                dependencies = id as unknown as [...TDependencies];
            } else {
                if (typeof id !== "undefined") {
                    token = id as unknown as InjectionToken<I>;
                }
            }
            container.registerRegistration(target, createRegistration(target, Lifetime.Transient, dependencies || []));
            if (token !== target) {
                container.registerType(token, { useToken: target });
            }
            return;
        }
        throw new InvalidDecoratorError("Transient", target);
    };
}

export function Scoped<TDependencies extends Array<InjectionToken | InterfaceId>, I = any>(
    id?: TDependencies extends Array<InterfaceId>
        ? InjectionToken | InterfaceId<I>
        : [...TDependencies] | InjectionToken | InterfaceId<I>,
    dependencies?: [...TDependencies],
) {
    return function <T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I }>(
        target: T,
        { kind }: ClassDecoratorContext,
    ) {
        if (kind === "class") {
            let token: InjectionToken<I> = target;
            if (Array.isArray(id)) {
                dependencies = id as unknown as [...TDependencies];
            } else {
                if (typeof id !== "undefined") {
                    token = id as unknown as InjectionToken<I>;
                }
            }
            container.registerRegistration(target, createRegistration(target, Lifetime.Scoped, dependencies || []));
            if (token !== target) {
                container.registerType(token, { useToken: target });
            }
            return;
        }
        throw new InvalidDecoratorError("Scoped", target);
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

export function AutoInjectable<TDependencies extends Array<InjectionToken | InterfaceId>, I = any>(
    dependencies?: [...TDependencies],
) {
    return function <T extends { new (...args: UnwrapDecoratorArgs<TDependencies> | any): I }>(
        target: T,
        { kind }: ClassDecoratorContext,
    ) {
        if (kind === "class") {
            const aClass = class extends (target as ConstructorType<any>) {
                constructor(...args: Array<any>) {
                    super(...args.concat((dependencies || []).map((a) => container.resolve(a))));
                }
            } as T;
            //container.register(target, { useClass: aClass });
            container.register(aClass, { useClass: aClass });
            return aClass;
        }
        throw new InvalidDecoratorError("AutoInjectable", target);
    };
}
