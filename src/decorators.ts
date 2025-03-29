import type { ConstructorType } from "./types/constructor.type.ts";
import type { IContainer } from "./types/container.interface.ts";
import type { InjectionToken } from "./types/injection-token.type.ts";
import type { UnwrapDecoratorArguments } from "./types/interface-token.type.ts";

import { Container, container } from "./container.ts";
import { InvalidDecoratorError } from "./exceptions/index.ts";
import { ProvidersType } from "./types/providers/provider.type.ts";
import { Lifetime, type Registration } from "./types/registration.interface.ts";

/**
 * @internal
 */
// eslint-disable-next-line perfectionist/sort-union-types
type DecoratorIdType = InjectionToken | Array<InjectionToken> | IContainer;

/**
 * @internal
 */
interface IAutoInjectableOptions {
  all?: Array<InjectionToken>;
  //scope?: ScopeContext;
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
    T extends new (...arguments_: any) => I,
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aClass = class extends (target as ConstructorType<any>) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...arguments_: Array<any>) {
          // Calls the target class constructor with the injected dependencies
          // eslint-disable-next-line sonarjs/super-invocation
          super(
            ...arguments_,
            ...(dependencies ?? []).map((a) =>
              options.all?.includes(a)
                ? container.resolveAll(a)
                : container.resolve(a),
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
export function Inject(token: Array<InjectionToken> | InjectionToken) {
  return function DecoratorFunction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    context: ClassMemberDecoratorContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    switch (context.kind) {
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
      case "field":
      case "getter": {
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolve(t))
            : container.resolve(token);
        };
      }
      case "method": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function (this: any, ...arguments_: Array<any>) {
          const instances = Array.isArray(token)
            ? token.map((t) => container.resolve(t))
            : [container.resolve(token)];
          return Reflect.apply(value, this, [...arguments_, ...instances]);
        };
      }
      default: {
        throw new InvalidDecoratorError(
          "Inject",
          context.name,
          "can only be used in a field, accessor, getter or method",
        );
      }
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
export function InjectAll(token: Array<InjectionToken> | InjectionToken) {
  return function DecoratorFunction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    context: ClassMemberDecoratorContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    switch (context.kind) {
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
      case "field":
      case "getter": {
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolveAll(t))
            : container.resolveAll(token);
        };
      }
      case "method": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function (this: any, ...arguments_: Array<any>) {
          const instances = Array.isArray(token)
            ? token.map((t) => container.resolveAll(t))
            : [container.resolveAll(token)];
          return Reflect.apply(value, this, [...arguments_, ...instances]);
        };
      }
      default: {
        throw new InvalidDecoratorError(
          "Inject",
          context.name,
          "can only be used in a field, accessor, getter or method",
        );
      }
    }
  };
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
  id?: DecoratorIdType,
  dependencies?: Array<InjectionToken> | IContainer,
  cont?: IContainer,
): ClassDecorator {
  return function <
    T extends new (
      ...arguments_: UnwrapDecoratorArguments<Array<InjectionToken>>
    ) => I,
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      const registerIn = getContainerToRegisterIn(id, dependencies, cont);

      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as Array<InjectionToken>;
      } else if (id !== undefined && !(id instanceof Container)) {
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
 * Decorator that registers a class as a singleton in the container.
 *
 * @param id - Optional token or array of tokens to register the class with.
 * @param dependencies - Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a singleton in the container.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Singleton<I = any>(
  id?: DecoratorIdType,
  dependencies?: Array<InjectionToken> | IContainer,
  cont?: IContainer,
): ClassDecorator {
  return function <
    T extends new (
      ...arguments_: UnwrapDecoratorArguments<Array<InjectionToken>>
    ) => I,
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      const registerIn = getContainerToRegisterIn(id, dependencies, cont);

      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as Array<InjectionToken>;
      } else if (id !== undefined && !(id instanceof Container)) {
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
 * @param id - Optional token or array of dependencies to register the class with.
 * @param dependencies - Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a transient in the container.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Transient<I = any>(
  id?: DecoratorIdType,
  dependencies?: Array<InjectionToken> | IContainer,
  cont?: IContainer,
): ClassDecorator {
  return function <
    T extends new (
      ...arguments_: UnwrapDecoratorArguments<Array<InjectionToken>>
    ) => I,
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      const registerIn = getContainerToRegisterIn(id, dependencies, cont);

      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as Array<InjectionToken>;
      } else if (id !== undefined && !(id instanceof Container)) {
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
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRegistration<T extends ConstructorType<any>>(
  target: T,
  lifetime: Lifetime,
  dependencies: Array<InjectionToken<unknown>>,
): Registration {
  return {
    injections: dependencies,
    options: { lifetime: lifetime },
    provider: { useClass: target },
    providerType: ProvidersType.ClassProvider,
  };
}

function getContainerToRegisterIn(
  id?: DecoratorIdType,
  dependencies?: Array<InjectionToken> | IContainer,
  cont?: IContainer,
): IContainer {
  if (cont && cont instanceof Container) {
    return cont;
  }
  if (dependencies && dependencies instanceof Container) {
    return dependencies;
  }
  if (id && id instanceof Container) {
    return id;
  }
  return container;
}
