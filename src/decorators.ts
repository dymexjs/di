import { Container, container } from "./container.ts";
import { InvalidDecoratorError } from "./exceptions/index.ts";
import { ScopeContext } from "./scope-context.ts";
import type { ConstructorType } from "./types/constructor.type.ts";
import type { UnwrapDecoratorArgs } from "./types/interface-token.type.ts";
import type { InjectionToken } from "./types/injection-token.type.ts";
import { ProvidersType } from "./types/providers/provider.type.ts";
import { Lifetime, type Registration } from "./types/registration.interface.ts";
import type { IContainer } from "./types/container.interface.ts";

/**
 * Decorator that registers a class as a singleton in the container.
 *
 * @param id - Optional token or array of tokens to register the class with.
 * @param dependencies - Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a singleton in the container.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Singleton<I = any>(
  id?: Array<InjectionToken> | InjectionToken | IContainer,
  dependencies?: Array<InjectionToken> | IContainer,
  cont?: IContainer,
): ClassDecorator {
  return function <
    T extends new (...args: UnwrapDecoratorArgs<Array<InjectionToken>>) => I,
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      const registerIn =
        cont && cont instanceof Container
          ? cont
          : dependencies && dependencies instanceof Container
            ? dependencies
            : id && id instanceof Container
              ? id
              : container;

      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as Array<InjectionToken>;
      } else if (typeof id !== "undefined" && !(id instanceof Container)) {
        // If id is a token, use it as the registration token
        token = id;
      }
      // Register the class as a singleton in the container
      registerIn.registerRegistration(
        target,
        createRegistration(
          target,
          Lifetime.Singleton,
          dependencies && Array.isArray(dependencies) ? dependencies : [],
        ),
      );
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        registerIn.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Singleton", context.name);
  } as ClassDecorator;
}

/**
 * Decorator that registers a class as a transient in the container.
 *
 * @param id - Optional token or array of tokens to register the class with.
 * @param dependencies - Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a transient in the container.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Transient<I = any>(
  id?: Array<InjectionToken> | InjectionToken | IContainer,
  dependencies?: Array<InjectionToken> | IContainer,
  cont?: IContainer,
): ClassDecorator {
  return function <
    T extends new (...args: UnwrapDecoratorArgs<Array<InjectionToken>>) => I,
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      const registerIn =
        cont && cont instanceof Container
          ? cont
          : dependencies && dependencies instanceof Container
            ? dependencies
            : id && id instanceof Container
              ? id
              : container;

      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as Array<InjectionToken>;
      } else if (typeof id !== "undefined" && !(id instanceof Container)) {
        // If id is a token, use it as the registration token
        token = id;
      }
      // Register the class as a singleton in the container
      registerIn.registerRegistration(
        target,
        createRegistration(
          target,
          Lifetime.Transient,
          dependencies && Array.isArray(dependencies) ? dependencies : [],
        ),
      );
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        registerIn.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Transient", context.name);
  } as ClassDecorator;
}

/**
 * Decorator that registers a class as a scoped in the container.
 *
 * @param id - Optional token or array of tokens to register the class with.
 * @param dependencies - Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a scoped in the container.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Scoped<I = any>(
  id?: Array<InjectionToken> | InjectionToken | IContainer,
  dependencies?: Array<InjectionToken> | IContainer,
  cont?: IContainer,
): ClassDecorator {
  return function <
    T extends new (...args: UnwrapDecoratorArgs<Array<InjectionToken>>) => I,
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      const registerIn =
        cont && cont instanceof Container
          ? cont
          : dependencies && dependencies instanceof Container
            ? dependencies
            : id && id instanceof Container
              ? id
              : container;

      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as Array<InjectionToken>;
      } else if (typeof id !== "undefined" && !(id instanceof Container)) {
        // If id is a token, use it as the registration token
        token = id;
      }
      // Register the class as a singleton in the container
      registerIn.registerRegistration(
        target,
        createRegistration(
          target,
          Lifetime.Scoped,
          dependencies && Array.isArray(dependencies) ? dependencies : [],
        ),
      );
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        registerIn.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Scoped", context.name);
  } as ClassDecorator;
}

/**
 * @internal
 */
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

/**
 * @internal
 */
interface IAutoInjectableOptions {
  all?: Array<InjectionToken>;
  scope?: ScopeContext;
}

/**
 * Class decorator that registers a class with the container and injects its dependencies.
 *
 * @param dependencies - Optional array of dependencies to inject into the class.
 * @param options - Optional options to customize the behavior of the decorator.
 * @returns A class decorator that registers the class with the container and injects its dependencies.
 */
export function AutoInjectable<
  TDependencies extends Array<InjectionToken>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  I = any,
>(dependencies?: [...TDependencies], options: IAutoInjectableOptions = {}) {
  /**
   * Registers a class with the container and injects its dependencies.
   *
   * @param target - The class to register.
   * @param context - The context of the target, which should be a class.
   * @returns The registered class.
   */
  return function <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends new (...args: UnwrapDecoratorArgs<TDependencies> | any) => I,
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aClass = class extends (target as ConstructorType<any>) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: Array<any>) {
          // Calls the target class constructor with the injected dependencies
          super(
            ...args.concat(
              (dependencies ?? []).map((a) =>
                options.all?.includes(a)
                  ? container.resolveAll(a, options.scope)
                  : container.resolve(a, options.scope),
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
    throw new InvalidDecoratorError("AutoInjectable", context.name);
  };
}

/**
 * Decorator that injects a dependency into a class.
 *
 * @param token - The token or array of tokens to inject.
 * @returns A decorator function that injects the dependency.
 *
 * The decorator can be used in one of the following ways:
 * - In a field: The dependency is injected when the class is instantiated.
 * - In an accessor: The dependency is injected when the accessor is called.
 * - In a getter: The dependency is injected when the getter is called.
 * - In a method: The dependency is injected when the method is called.
 * @throws \{InvalidDecoratorError\} If the decorator is used in a context that is not one of the above.
 */
export function Inject(token: InjectionToken | Array<InjectionToken>) {
  return function DecoratorFn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    context: ClassMemberDecoratorContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    switch (context.kind) {
      case "field":
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolve(t))
            : container.resolve(token);
        };
      case "accessor": {
        const instance = Array.isArray(token)
          ? token.map((t) => container.resolve(t))
          : container.resolve(token);
        return {
          get() {
            return instance;
          },
        };
      }
      case "method":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function (this: any, ...args: Array<any>) {
          const instances = Array.isArray(token)
            ? token.map((t) => container.resolve(t))
            : [container.resolve(token)];
          const argsConcat = args.concat(instances);
          return value.apply(this, argsConcat);
        };
      case "getter":
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolve(t))
            : container.resolve(token);
        };
      default:
        throw new InvalidDecoratorError(
          "Inject",
          context.name,
          "can only be used in a field, accessor, getter or method",
        );
    }
  };
}

/**
 * Decorator that injects all instances of a token into a class.
 *
 * @param token - The token or array of tokens to inject.
 * @returns A decorator function that injects the dependency.
 *
 * The decorator can be used in one of the following ways:
 * - In a field: The dependency is injected when the class is instantiated.
 * - In an accessor: The dependency is injected when the accessor is called.
 * - In a getter: The dependency is injected when the getter is called.
 * - In a method: The dependency is injected when the method is called.
 * @throws \{InvalidDecoratorError\} If the decorator is used in a context that is not one of the above.
 */
export function InjectAll(token: InjectionToken | Array<InjectionToken>) {
  return function DecoratorFn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    context: ClassMemberDecoratorContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    switch (context.kind) {
      case "field":
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolveAll(t))
            : container.resolveAll(token);
        };
      case "accessor": {
        const instance = Array.isArray(token)
          ? token.map((t) => container.resolveAll(t))
          : container.resolveAll(token);
        return {
          get() {
            return instance;
          },
          init() {
            return instance;
          },
        };
      }
      case "method":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function (this: any, ...args: Array<any>) {
          const instances = Array.isArray(token)
            ? token.map((t) => container.resolveAll(t))
            : [container.resolveAll(token)];
          const argsConcat = args.concat(instances);
          return value.apply(this, argsConcat);
        };
      case "getter":
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolveAll(t))
            : container.resolveAll(token);
        };
      default:
        throw new InvalidDecoratorError(
          "Inject",
          context.name,
          "can only be used in a field, accessor, getter or method",
        );
    }
  };
}
