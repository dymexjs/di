import { container } from "./container";
import { InvalidDecoratorError } from "./exceptions/InvalidDecoratorError";
import { ConstructorType } from "./types/constructor.type";
import { InterfaceId, UnwrapDecoratorArgs } from "./types/decorators.type";
import { InjectionToken } from "./types/injection-token.type";
import { ProvidersType } from "./types/providers/provider.type";
import { Lifetime, Registration } from "./types/registration.interface";

const getRandomString = () => Math.random().toString(36).substring(2, 15);

/**
 * Creates a runtime identifier of an interface used for dependency injection.
 *
 * Every call to this function produces unique identifier, you can't call this method twice for the same Type!
 */
export const createInterfaceId = <T>(id: string): InterfaceId<T> => `${id}-${getRandomString()}` as InterfaceId<T>;

/**
 * Decorator that registers a class as a singleton in the container.
 *
 * @param id Optional token or array of tokens to register the class with.
 * @param dependencies Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a singleton in the container.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Singleton<TDependencies extends Array<InjectionToken | InterfaceId>, I = any>(
  id?: TDependencies extends Array<InterfaceId>
    ? InjectionToken | InterfaceId<I>
    : [...TDependencies] | InjectionToken | InterfaceId<I>,
  dependencies?: [...TDependencies],
): ClassDecorator {
  return function <T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I }>(
    target: T,
    { kind }: ClassDecoratorContext,
  ) {
    if (kind === "class") {
      let token: InjectionToken<I> = target;
      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as unknown as [...TDependencies];
      } else {
        // If id is a token, use it as the registration token
        if (typeof id !== "undefined") {
          token = id as unknown as InjectionToken<I>;
        }
      }
      // Register the class as a singleton in the container
      container.registerRegistration(target, createRegistration(target, Lifetime.Singleton, dependencies ?? []));
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        container.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Singleton", target);
  } as ClassDecorator;
}

/**
 * Decorator that registers a class as a transient in the container.
 *
 * @param id Optional token or array of tokens to register the class with.
 * @param dependencies Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a transient in the container.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Transient<TDependencies extends Array<InjectionToken | InterfaceId>, I = any>(
  id?: TDependencies extends Array<InterfaceId>
    ? InjectionToken | InterfaceId<I>
    : [...TDependencies] | InjectionToken | InterfaceId<I>,
  dependencies?: [...TDependencies],
): ClassDecorator {
  return function <T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I }>(
    target: T,
    { kind }: ClassDecoratorContext,
  ) {
    if (kind === "class") {
      let token: InjectionToken<I> = target;
      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as unknown as [...TDependencies];
      } else {
        // If id is a token, use it as the registration token
        if (typeof id !== "undefined") {
          token = id as unknown as InjectionToken<I>;
        }
      }
      // Register the class as a transient in the container
      container.registerRegistration(target, createRegistration(target, Lifetime.Transient, dependencies ?? []));
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        container.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Transient", target);
  } as ClassDecorator;
}

/**
 * Decorator that registers a class as a scoped in the container.
 *
 * @param id Optional token or array of tokens to register the class with.
 * @param dependencies Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a scoped in the container.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Scoped<TDependencies extends Array<InjectionToken | InterfaceId>, I = any>(
  id?: TDependencies extends Array<InterfaceId>
    ? InjectionToken | InterfaceId<I>
    : [...TDependencies] | InjectionToken | InterfaceId<I>,
  dependencies?: [...TDependencies],
): ClassDecorator {
  return function <T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I }>(
    target: T,
    { kind }: ClassDecoratorContext,
  ) {
    if (kind === "class") {
      let token: InjectionToken<I> = target;
      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as unknown as [...TDependencies];
      } else {
        // If id is a token, use it as the registration token
        if (typeof id !== "undefined") {
          token = id as unknown as InjectionToken<I>;
        }
      }
      // Register the class as a scoped in the container
      container.registerRegistration(target, createRegistration(target, Lifetime.Scoped, dependencies ?? []));
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        container.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Scoped", target);
  } as ClassDecorator;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRegistration<T extends ConstructorType<any>>(
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

type IAutoInjectableOptions = {
  all?: Array<InjectionToken | InterfaceId>;
};

/**
 * Class decorator that registers a class with the container and injects its dependencies.
 *
 * @param dependencies Optional array of dependencies to inject into the class.
 * @param options Optional options to customize the behavior of the decorator.
 * @returns A class decorator that registers the class with the container and injects its dependencies.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AutoInjectable<TDependencies extends Array<InjectionToken | InterfaceId>, I = any>(
  dependencies?: [...TDependencies],
  options: IAutoInjectableOptions = {},
) {
  /**
   * Registers a class with the container and injects its dependencies.
   *
   * @param target The class to register.
   * @param {kind} The kind of the target, which should be a class.
   * @returns The registered class.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function <T extends { new (...args: UnwrapDecoratorArgs<TDependencies> | any): I }>(
    target: T,
    { kind }: ClassDecoratorContext,
  ) {
    if (kind === "class") {
      /**
       * Creates a new class that extends the target class and injects its dependencies.
       *
       * @private
       * @class
       * @extends {T}
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aClass = class extends (target as ConstructorType<any>) {
        /**
         * Constructor that calls the target class constructor with the injected dependencies.
         *
         * @param {...any} args The arguments to pass to the target class constructor.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: Array<any>) {
          // Calls the target class constructor with the injected dependencies
          super(
            ...args.concat(
              (dependencies ?? []).map((a) =>
                options.all?.includes(a) ? container.resolveAll(a) : container.resolve(a),
              ),
            ),
          );
        }
      } as T;
      // Registers the class with the container
      container.register(aClass, { useClass: aClass });
      // Registers an alias for the class with the target class
      container.registerType(target, { useToken: aClass });
      // Returns the registered class
      return aClass;
    }
    throw new InvalidDecoratorError("AutoInjectable", target);
  };
}
