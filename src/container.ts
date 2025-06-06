import type { IContainer } from "./types/container.interface.ts";
import type { IScopeContext } from "./types/scope-context.interface.ts";
import type { StaticInjectable } from "./types/static-inject.interface.ts";

import { STATIC_INJECTION_LIFETIME, STATIC_INJECTIONS } from "./constants.ts";
import {
  TokenNotFoundError,
  TokenRegistrationCycleError,
  UndefinedScopeError,
} from "./exceptions/index.ts";
import { isAsyncDisposable, isDisposable } from "./helpers.ts";
import { ScopeContext } from "./scope-context.ts";
import { ServiceMap } from "./service-map.ts";
import {
  type ConstructorType,
  isConstructorType,
} from "./types/constructor.type.ts";
import {
  type InjectionToken,
  isNormalToken,
} from "./types/injection-token.type.ts";
import {
  getInterfaceToken,
  InterfaceToken,
} from "./types/interface-token.type.ts";
import {
  type ClassProvider,
  type FactoryFunction,
  type FactoryProvider,
  getProviderType,
  isClassProvider,
  isProvider,
  isTokenProvider,
  type Provider,
  ProvidersType,
  type TokenProvider,
  type ValueProvider,
} from "./types/providers/index.ts";
import {
  Lifetime,
  type Registration,
  type RegistrationOptions,
} from "./types/registration.interface.ts";

export class Container implements IContainer {
  readonly #_services = new ServiceMap<InjectionToken, Registration>();
  readonly #_resolutionStack = new Map<InjectionToken, unknown>();
  #_childContainer?: IContainer;
  readonly #_parent?: Container;
  readonly #_IContainerToken: InterfaceToken;

  constructor(parent?: Container) {
    this.#_parent = parent;
    this.#_IContainerToken = getInterfaceToken("IContainer");
  }

  async [Symbol.asyncDispose]() {
    if (this.#_childContainer !== undefined) {
      await this.#_childContainer[Symbol.asyncDispose]();
    }
    await this.#_services[Symbol.asyncDispose]();
    this.#_resolutionStack.clear();
  }
  /**
   * Clears all instances from the container, disposing them if they
   * implement the `IAsyncDisposable` or `IDisposable` interface.
   *
   * This method is useful for testing, as it allows you to clear out
   * all instances from the container, so you can start from a clean
   * slate.
   *
   * @returns A promise that resolves when all instances have been
   * cleared.
   */
  async clearInstances(): Promise<void> {
    const promises = [] as Array<Promise<void>>;

    for (const registrations of this.#_services.values()) {
      for (const registration of registrations.filter(
        (x) => x.providerType !== ProvidersType.ValueProvider,
      )) {
        if (registration.instance) {
          if (isAsyncDisposable(registration.instance)) {
            promises.push(
              registration.instance[Symbol.asyncDispose]() as Promise<void>,
            );
          }
          if (isDisposable(registration.instance)) {
            registration.instance[Symbol.dispose]();
          }
          registration.instance = undefined;
        }
      }
    }

    await Promise.all(promises);
  }
  /**
   * Creates a new child container.
   *
   * The child container will have a reference to the current container as its parent.
   * The child container is also stored in the current container, so it can be properly disposed when the parent container is disposed.
   *
   * @returns The new child container.
   */
  createChildContainer(): IContainer {
    const childContainer = new Container(this);
    //Saves child container for dispose from main container
    this.#_childContainer = childContainer;
    return childContainer;
  }
  /**
   * Creates a new scope.
   *
   * A scope is used to separate registrations into different groups.
   * Each scope has its own set of registrations, which are stored
   * in the scope's `services` property.
   *
   * @returns The new scope.
   */
  createScope(): IScopeContext {
    const scope = new ScopeContext(this);
    return scope;
  }
  //#region Register
  addSingleton<T>(
    target: ConstructorType<T>,
    injections?: Array<InjectionToken>,
  ): IContainer {
    return this.registerSingleton(target, { useClass: target }, injections);
  }
  addTransient<T>(
    target: ConstructorType<T>,
    injections?: Array<InjectionToken>,
  ): IContainer {
    return this.registerTransient(target, { useClass: target }, injections);
  }
  addScoped<T>(
    target: ConstructorType<T>,
    injections?: Array<InjectionToken>,
  ): IContainer {
    return this.registerScoped(target, { useClass: target }, injections);
  }
  get<T>(token: InjectionToken<T>): Registration<T> | undefined {
    return this.getRegistration(token);
  }
  has<T>(token: InjectionToken<T>): boolean {
    return this.hasRegistration(token);
  }
  /**
   * Registers a provider in the container.
   * @param token - The token to register the provider with.
   * @param provider - The provider to register. This can be an instance of `Provider`, a class, or a constructor token.
   * @param options - Options for the registration. If not specified, the lifetime of the registration will be `Lifetime.Transient`. @see RegistrationOptions
   * @returns The container used for the registration
   */
  register<T>(
    token: InjectionToken,
    provider: ConstructorType<T> | Provider<T>,
    options?: RegistrationOptions,
  ): IContainer {
    const opt: RegistrationOptions = {
      lifetime: options?.lifetime ?? Lifetime.Transient,
    };

    const service: Provider<T> = isProvider(provider)
      ? provider
      : { useClass: provider };

    if (isTokenProvider(service)) {
      this.inspectCircularTokenProvider(token, service);
    }

    let injections = options?.injections ?? [];

    if (isClassProvider(service)) {
      if (
        options === undefined &&
        // eslint-disable-next-line security/detect-object-injection
        ((service as ClassProvider<T>).useClass as StaticInjectable)[
          STATIC_INJECTION_LIFETIME
        ] !== undefined
      ) {
        // eslint-disable-next-line security/detect-object-injection
        opt.lifetime = (
          (service as ClassProvider<T>).useClass as StaticInjectable
        )[STATIC_INJECTION_LIFETIME];
      }
      if (
        // eslint-disable-next-line security/detect-object-injection
        ((service as ClassProvider<T>).useClass as StaticInjectable)[
          STATIC_INJECTIONS
        ] !== undefined
      ) {
        // eslint-disable-next-line security/detect-object-injection
        injections = (
          (service as ClassProvider<T>).useClass as StaticInjectable
        )[STATIC_INJECTIONS];
      }
    }

    return this.registerRegistration(token, {
      injections,
      options: opt,
      provider: service,
      providerType: getProviderType(service),
    });
  }
  /**
   * Registers a factory function with the specified token in the container.
   * The factory function will be called each time the token is resolved.
   * @param token - The token to register the factory with.
   * @param factory - The factory function to register.
   * @returns The container used for the registration.
   */
  registerFactory<T>(
    token: InjectionToken<T>,
    factory: FactoryFunction<T>,
    injections: Array<InjectionToken> = [],
  ): IContainer {
    return this.register(
      token,
      { useFactory: factory },
      { injections, lifetime: Lifetime.Singleton },
    );
  }
  /**
   * Registers an instance of a class with the specified token.
   * This registration is a singleton, meaning that the same instance
   * will be returned each time the token is resolved.
   * @param token - The token to register the instance with.
   * @param instance - The instance to register.
   * @returns The container used for the registration
   */
  registerInstance<T>(token: InjectionToken, instance: T): IContainer {
    this.#_services.set(token, {
      injections: [],
      options: { lifetime: Lifetime.Singleton },
      provider: { useValue: instance },
      providerType: ProvidersType.ValueProvider,
    });
    return this;
  }
  /**
   * Registe a registration object directly
   * @param token - The token to register
   * @param registration - The registration object
   * @returns The container used for the registration
   */
  registerRegistration(
    token: InjectionToken,
    registration: Registration,
  ): IContainer {
    this.#_services.set(token, registration);
    return this;
  }
  /**
   * Registers a class as a scoped in the container.
   * @param token - The token to register the class with.
   * @param target - The class to register.
   * @param injections - An array of tokens to inject into the class constructor.
   * @returns The container used for the registration.
   */
  registerScoped<T>(
    token: InjectionToken<T>,
    target: ClassProvider<T> | ConstructorType<T>,
    injections: Array<InjectionToken> = [],
  ): IContainer {
    return this.register(token, target, {
      injections,
      lifetime: Lifetime.Scoped,
    });
  }
  /**
   * Registers a class as a singleton in the container.
   * @param token - The token to register the class with.
   * @param target - The class to register.
   * @param injections - An array of tokens to inject into the class constructor.
   * @returns The container used for the registration.
   */
  registerSingleton<T>(
    token: InjectionToken<T>,
    target: ClassProvider<T> | ConstructorType<T>,
    injections: Array<InjectionToken> = [],
  ): IContainer {
    return this.register(token, target, {
      injections,
      lifetime: Lifetime.Singleton,
    });
  }
  /**
   * Registers a class as a transient in the container.
   * @param token - The token to register the class with.
   * @param target - The class to register.
   * @param injections -  An array of tokens to inject into the class constructor.
   * @returns The container used for the registration.
   */
  registerTransient<T>(
    token: InjectionToken<T>,
    target: ClassProvider<T> | ConstructorType<T>,
    injections: Array<InjectionToken> = [],
  ): IContainer {
    return this.register(token, target, {
      injections,
      lifetime: Lifetime.Transient,
    });
  }
  /**
   * Registers a token to redirect to another token, 'to' must exist before registration
   * @param from - The token to be registered
   * @param to - The token to where the from token will redirect to
   * @returns The container used for the registration
   */
  registerType<T>(
    from: InjectionToken,
    to: InjectionToken<T> | TokenProvider<T>,
  ): IContainer {
    // If 'to' is a TokenProvider, we need to check if the token it's pointing to exists
    if (isTokenProvider(to as TokenProvider<T>)) {
      // If the token doesn't exist, throw an error
      if (this.hasRegistration((to as TokenProvider<T>).useToken)) {
        // If the token exists, register 'from' with the TokenProvider
        return this.register(from, to as TokenProvider<T>);
      } else {
        throw new TokenNotFoundError((to as TokenProvider<T>).useToken);
      }
    }
    // If 'to' is a normal token, register 'from' with a new TokenProvider
    if (isNormalToken(to as InjectionToken)) {
      return this.register(from, { useToken: to as InjectionToken });
    }
    // If 'to' is a constructor, register 'from' with a new ClassProvider
    return this.register(from, { useClass: to as ConstructorType<unknown> });
  }
  /**
   * Registers a value with the specified token in the container.
   * This registration is a singleton, meaning that the same value
   * will be returned each time the token is resolved.
   * @param token - The token to register the value with.
   * @param value - The value to register.
   * @returns The container used for the registration.
   */
  registerValue<T>(token: InjectionToken<T>, value: T): IContainer {
    return this.register(
      token,
      { useValue: value },
      { lifetime: Lifetime.Singleton },
    );
  }
  remove<T>(
    token: InjectionToken<T>,
    registration: Registration<T>,
  ): Promise<IContainer> {
    return this.removeRegistration(token, (x) => x === registration);
  }
  /**
   * Removes all registrations that match the predicate from the container.
   * If no predicate is specified, all registrations are removed.
   * @param token - The token to remove registrations from
   * @param predicate - A function that takes a Registration and returns a boolean indicating whether the registration should be removed
   * @returns The container used for the removal
   */
  async removeRegistration<T>(
    token: InjectionToken,
    predicate?: (registration: Registration<T>) => boolean,
  ): Promise<IContainer> {
    if (!this.hasRegistration(token)) {
      throw new TokenNotFoundError(token);
    }

    // If no predicate is specified, all registrations should be removed
    if (predicate === undefined) {
      predicate = () => true;
    }

    // Remove all registrations that match the predicate
    for (const registration of this.#_services
      .getAll(token)
      .filter((x) => predicate(x))) {
      await this.#_services.delete(token, registration);
    }

    return this;
  }
  //#endregion Register
  /**
   * Resets the container by clearing all registrations and disposing all scopes.
   * This method is useful for testing, as it allows you to clear out all registrations
   * and scopes, so you can start from a clean slate.
   * @returns A promise that resolves when all registrations and scopes have been cleared.
   */
  async dispose(): Promise<void> {
    // Dispose all registrations
    // We use the [Symbol.asyncDispose] method to ensure that all registrations are disposed of, even if one of them throws an error
    return this[Symbol.asyncDispose]();
  }
  //#region Resolve
  /**
   * Resolves the specified token to an instance.
   * If the token is already being resolved (i.e. a circular dependency is detected),
   * a proxy is returned instead.
   * @param token - The token to resolve.
   * @param scope - Optional scope to resolve the token in.
   * @returns The resolved instance.
   */
  resolve<T>(token: InjectionToken, scope?: IScopeContext): T {
    if (token === this.#_IContainerToken || token === Container) {
      return this as unknown as T;
    }
    // Check if the token is already being resolved (i.e. a circular dependency is detected)
    if (this.#_resolutionStack.has(token)) {
      // If so, return a proxy
      if (this.#_resolutionStack.get(token) === null) {
        this.#_resolutionStack.set(token, this.createProxy<T>(token));
      }
      return this.#_resolutionStack.get(token) as T;
    }

    // If not, set the token to null in the resolution stack and try to resolve it
    // eslint-disable-next-line unicorn/no-null
    this.#_resolutionStack.set(token, null);

    try {
      if (!this.hasRegistration(token)) {
        // If the token is not registered, check if it is a constructor
        if (isConstructorType(token)) {
          // If so, resolve it as a constructor
          return this.resolveConstructor(token, scope);
        }
        // If not, throw an error
        throw new TokenNotFoundError(token);
      }

      // If the token is registered, get the registration and resolve it
      const registration =
        (scope && scope.getRegistration(token)) ?? this.getRegistration(token);
      if (registration) {
        return this.resolveRegistration(token, registration, scope);
      } else {
        throw new TokenNotFoundError(token);
      }
    } finally {
      // Remove the token from the resolution stack
      this.#_resolutionStack.delete(token);
    }
  }
  /**
   * Resolves all instances of the specified token.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an array of resolved instances.
   * @param token - The token to resolve.
   * @param scope - Optional scope to resolve the token in.
   * @returns An array of resolved instances.
   */
  resolveAll<T>(token: InjectionToken, scope?: IScopeContext): Array<T> {
    if (!this.hasRegistration(token)) {
      if (isConstructorType(token)) {
        // If the token is a constructor, we can resolve it as a constructor
        return [this.resolve(token, scope)];
      }
      // If the token is not registered, throw an error
      throw new TokenNotFoundError(token);
    }

    // If the token is registered, get all registrations and resolve them
    const registrations =
      (scope && scope.getAllRegistrations(token)) ??
      this.getAllRegistrations(token);
    return registrations.map((registration) =>
      this.resolveRegistration(token, registration, scope),
    );
  }
  /**
   * Resolves all instances of the specified token asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an array of resolved instances.
   * @param token - The token to resolve.
   * @param scope - Optional scope to resolve the token in.
   * @returns A promise that resolves with an array of resolved instances.
   */
  async resolveAllAsync<T>(
    token: InjectionToken,
    scope?: IScopeContext,
  ): Promise<Array<T>> {
    if (!this.hasRegistration(token)) {
      if (isConstructorType(token)) {
        // If the token is a constructor, we can resolve it as a constructor
        return [await this.resolveAsync(token, scope)];
      }
      // If the token is not registered, throw an error
      throw new TokenNotFoundError(token);
    }

    // If the token is registered, get all registrations and resolve them
    const registrations =
      (scope && scope.getAllRegistrations(token)) ??
      this.getAllRegistrations(token);
    const result: Array<T> = [];
    for (const registration of registrations) {
      // Resolve each registration asynchronously
      result.push(
        await this.resolveRegistrationAsync<T>(token, registration, scope),
      );
    }
    // Return the array of resolved instances
    return result;
  }
  /**
   * Resolves the specified token asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * If the token is already being resolved (i.e. a circular dependency is detected),
   * a proxy is returned instead.
   * @param token - The token to resolve.
   * @param scope - Optional scope to resolve the token in.
   * @returns A promise that resolves with an instance of the type.
   */
  async resolveAsync<T>(
    token: InjectionToken,
    scope?: IScopeContext,
  ): Promise<T> {
    if (token === this.#_IContainerToken || token === Container) {
      return this as unknown as T;
    }
    // Check if the token is already being resolved (i.e. a circular dependency is detected)
    if (this.#_resolutionStack.has(token)) {
      //Circular dependency detected, return a proxy
      if (this.#_resolutionStack.get(token) === null) {
        this.#_resolutionStack.set(token, this.createProxy<T>(token));
      }
      return (await this.#_resolutionStack.get(token)) as T;
    }
    // eslint-disable-next-line unicorn/no-null
    this.#_resolutionStack.set(token, null);

    try {
      // If the token is not registered, throw an error
      if (!this.hasRegistration(token)) {
        if (isConstructorType(token)) {
          // If the token is a constructor, we can resolve it as a constructor
          return await this.resolveConstructorAsync(token, scope);
        }
        throw new TokenNotFoundError(token);
      }

      // If the token is registered, get the registration and resolve it
      const registration =
        (scope && scope.getRegistration(token)) ?? this.getRegistration(token);
      if (registration) {
        return await this.resolveRegistrationAsync(token, registration, scope);
      } else {
        throw new TokenNotFoundError(token);
      }
    } finally {
      // Remove the token from the resolution stack
      this.#_resolutionStack.delete(token);
    }
  }
  /**
   * Resolves the specified token with the given arguments.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * @param token - The token to resolve.
   * @param args - Optional arguments to pass to the constructor.
   * @param scope - Optional scope to resolve the token in.
   * @returns An instance of the type.
   */
  resolveWithArgs<T>(
    token: InjectionToken,
    arguments_: Array<unknown> = [],
    scope?: IScopeContext,
  ): T {
    // If the token is not registered, throw an error
    if (!this.hasRegistration(token)) {
      if (isConstructorType(token)) {
        // If the token is a constructor, we can resolve it as a constructor
        return this.resolveConstructor(token);
      }
      throw new TokenNotFoundError(token);
    }

    // If the token is registered, get the registration and resolve it
    const registration =
      (scope && scope.getRegistration(token)) ??
      (this.getRegistration(token) as Registration<T>);
    const resolvedArguments = this.createArgs(registration, scope);
    return this.createInstance<T>(
      (registration.provider as ClassProvider<T>).useClass,
      [...arguments_, ...resolvedArguments],
    );
  }
  /**
   * Resolves the specified token with the given arguments asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * @param token - The token to resolve.
   * @param args - Optional arguments to pass to the constructor.
   * @param scope - Optional scope to resolve the token in.
   * @returns A promise that resolves with an instance of the type.
   */
  async resolveWithArgsAsync<T>(
    token: InjectionToken,
    arguments_: Array<unknown> = [],
    scope?: IScopeContext,
  ): Promise<T> {
    // If the token is not registered, throw an error
    if (!this.hasRegistration(token)) {
      if (isConstructorType(token)) {
        // If the token is a constructor, we can resolve it as a constructor
        return this.resolveConstructorAsync(token);
      }
      throw new TokenNotFoundError(token);
    }

    // If the token is registered, get the registration and resolve it
    const registration =
      (scope && scope.getRegistration(token)) ??
      (this.getRegistration(token) as Registration<T>);
    const resolvedArguments = await this.createArgsAsync(registration, scope);
    // Create an instance of the class with the resolved arguments and the arguments passed by the user
    return this.createInstance<T>(
      (registration.provider as ClassProvider<T>).useClass,
      [...arguments_, ...resolvedArguments],
    );
  }
  /**
   * Gets all registrations for the specified token.
   * @param token - The token to get the registrations for.
   * @returns An array of registrations.
   */
  getAllRegistrations<T>(token: InjectionToken<T>): Array<Registration> {
    /**
     * If the token is registered in the current container, return the registrations.
     */
    const regs = this.#_services.getAll(token);
    if (regs.length > 0) {
      return regs;
    }
    /**
     * If the token is not registered in the current container, but there is a parent container,
     * call the parent container's getAllRegistrations method to get the registrations.
     */
    if (this.#_parent !== undefined) {
      return this.#_parent.getAllRegistrations(token);
    }
    /**
     * If the token is not registered in any container, return an empty array.
     */
    return [];
  }

  //#endregion Resolve
  /**
   * Creates an array of arguments to pass to the constructor of the implementation of the specified registration.
   * The arguments are resolved from the container using the tokens specified in the registration's `injections` property.
   * @param registration - The registration to create the arguments for.
   * @param scope - Optional scope to resolve the tokens in.
   * @returns An array of arguments to pass to the constructor.
   */
  private createArgs(
    registration: Registration,
    scope?: IScopeContext,
  ): Array<unknown> {
    return registration.injections.map((token) =>
      scope ? scope.resolve(token) : this.resolve(token, scope),
    );
  }
  /**
   * Creates an array of arguments to pass to the constructor of the implementation of the specified registration asynchronously.
   * The arguments are resolved from the container using the tokens specified in the registration's `injections` property.
   * @param registration - The registration to create the arguments for.
   * @param scope - Optional scope to resolve the tokens in.
   * @returns A promise that resolves with an array of arguments to pass to the constructor.
   */
  private async createArgsAsync(
    registration: Registration,
    scope?: IScopeContext,
  ): Promise<Array<unknown>> {
    // Create an array to store the resolved arguments
    const arguments_: Array<unknown> = [];
    // Iterate over the tokens in the registration's `injections` property
    for (const token of registration.injections) {
      // Resolve each token asynchronously and add the result to the arguments array
      arguments_.push(
        await (scope
          ? scope.resolveAsync(token)
          : this.resolveAsync(token, scope)),
      );
    }
    // Return the array of resolved arguments
    return arguments_;
  }
  /**
   * Creates an instance of the specified implementation using the given arguments.
   * @param implementation - The implementation to create an instance of.
   * @param args - The arguments to pass to the constructor.
   * @returns The created instance.
   */
  private createInstance<T>(
    implementation: ConstructorType<T>,
    arguments_: Array<unknown> = [],
  ): T {
    // Create the instance using the specified implementation and arguments
    const instance: T = Reflect.construct(implementation, arguments_);
    // Return the created instance
    return instance;
  }
  /**
   * Creates a proxy for the specified token.
   * The proxy will resolve the token from the container using the `resolve` method when any of the proxy's methods or properties are accessed.
   * @param token - The token to create a proxy for.
   * @returns The created proxy.
   */
  private createProxy<T>(token: InjectionToken): T {
    let init = false;
    let value: T;
    /**
     * Function that resolves the token from the container and stores the result in the `value` property.
     * This function is used as the target of the proxy's methods and properties.
     */
    const resolvedObject: () => T = () => {
      if (!init) {
        value = container.resolve<T>(token);
        init = true;
      }
      return value;
    };
    /**
     * The proxy handler that will be used to intercept the proxy's methods and properties.
     * The handler will call the `resolvedObject` function to resolve the token from the container and use the result as the target of the method or property.
     */
    const handler: ProxyHandler<never> = {};
    /**
     * Function that creates a proxy handler for a specific method or property.
     * The handler will call the `resolvedObject` function to resolve the token from the container and use the result as the target of the method or property.
     * @param method - The method or property to create a handler for.
     */
    const action = (method: keyof ProxyHandler<never>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (...arguments_: Array<any>) => {
        // We need to maintain this condition to avoid an infinite loop when trying to resolve the await that calls the then() from the promise
        if (
          method === "get" &&
          arguments_[1] === "then" &&
          arguments_[0].then === undefined
        ) {
          return proxy;
        }
        // Call the resolvedObject function to resolve the token from the container
        arguments_[0] = resolvedObject();
        // Call the method or property on the resolved object
        // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
        const value_ = (Reflect[method] as any)(...arguments_);
        // If the result is a function, bind it to the resolved object
        return typeof value_ === "function"
          ? value_.bind(resolvedObject())
          : value_;
      };
    };
    // Create the proxy handler for each method and property
    for (const method of Object.getOwnPropertyNames(Reflect) as Array<
      keyof ProxyHandler<never>
    >) {
      // eslint-disable-next-line security/detect-object-injection
      handler[method] = action(method);
    }
    for (const method of Object.getOwnPropertySymbols(
      Reflect,
    ) as unknown as Array<keyof ProxyHandler<never>>) {
      // eslint-disable-next-line security/detect-object-injection
      handler[method] = action(method);
    }
    // Create the proxy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proxy = new Proxy<any>({}, handler) as T;
    // Return the proxy
    return proxy;
  }
  /**
   * Gets the registration for the specified token.
   * @param token - The token to get the registration for.
   * @returns The registration or undefined if not found.
   */
  private getRegistration(token: InjectionToken): Registration | undefined {
    /**
     * If the token is registered in the current container, return the registration.
     */
    if (this.#_services.has(token)) {
      return this.#_services.get(token);
    }

    /**
     * If the token is not registered in the current container, but there is a parent container,
     * call the parent container's getRegistration method to get the registration.
     */
    if (this.#_parent !== undefined) {
      return this.#_parent.getRegistration(token);
    }

    /**
     * If the token is not registered in any container, return undefined.
     */
    return undefined;
  }
  /**
   * Checks if the specified token has a registration in the current container.
   * If the token is not registered in the current container, but there is a parent container,
   * calls the parent container's hasRegistration method to check if the token is registered.
   * @param token - The token to check.
   * @returns True if the token has a registration, false otherwise.
   */
  private hasRegistration(token: InjectionToken): boolean {
    /**
     * If the token is registered in the current container, return true.
     */
    if (this.#_services.has(token)) {
      return true;
    }

    /**
     * If the token is not registered in the current container, but there is a parent container,
     * call the parent container's hasRegistration method to check if the token is registered.
     */
    if (this.#_parent !== undefined) {
      return this.#_parent.hasRegistration(token);
    }

    /**
     * If the token is not registered in any container, return false.
     */
    return false;
  }
  /**
   * Checks if there is a circular reference in the token providers.
   * A circular reference occurs when a token provider refers to another token provider
   * that refers to the same token as the original token provider.
   * @param token - The token to start the search from.
   * @param provider - The provider of the token.
   */
  private inspectCircularTokenProvider<T>(
    token: InjectionToken<T>,
    provider: TokenProvider<T>,
  ): void {
    const seenTokens = new Set<InjectionToken>([token]);
    let tokenProvider: TokenProvider<T> | undefined = provider;
    while (tokenProvider !== undefined) {
      const current = tokenProvider.useToken;
      if (seenTokens.has(current)) {
        throw new TokenRegistrationCycleError([token, ...seenTokens, current]);
      }
      seenTokens.add(current);
      const registation = this.getRegistration(current);
      tokenProvider =
        registation && isTokenProvider<T>(registation.provider)
          ? registation.provider
          : undefined;
    }
  }
  /**
   * Resolves a constructor token to an instance.
   * @param token - The token to resolve.
   * @param scope - Optional scope to resolve the token in.
   * @returns The resolved instance.
   */
  private resolveConstructor<T>(
    token: ConstructorType<T>,
    scope?: IScopeContext,
  ): T {
    //Get the lifetime of the token. If not specified, the lifetime is Transient.
    const lifetime: Lifetime =
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
      (token as StaticInjectable<any>)[STATIC_INJECTION_LIFETIME] ??
      Lifetime.Transient;
    const injections =
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
      (token as StaticInjectable<any>)[STATIC_INJECTIONS] ?? [];
    const arguments_ = this.createArgs({ injections } as Registration, scope);

    const instance = this.createInstance(token, arguments_);

    //If the lifetime is scoped, store the instance in the scope.
    if (lifetime === Lifetime.Scoped) {
      if (scope === undefined) {
        throw new UndefinedScopeError(token);
      }
      scope.registerRegistration(token, {
        injections,
        instance,
        options: { lifetime },
        provider: { useClass: token },
        providerType: ProvidersType.ClassProvider,
      });
    }

    this.register(token, { useClass: token }, { lifetime });

    //If the lifetime is singleton, store the instance in the registration.
    if (lifetime === Lifetime.Singleton) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.getRegistration(token)!.instance = instance;
    }
    return instance;
  }
  /**
   * Resolves a constructor token to an instance asynchronously.
   * @param token - The token to resolve.
   * @param scope - Optional scope to resolve the token in.
   * @returns The resolved instance.
   */
  private async resolveConstructorAsync<T>(
    token: ConstructorType<T>,
    scope?: IScopeContext,
  ): Promise<T> {
    // Get the lifetime of the token. If not specified, the lifetime is Transient.
    const lifetime: Lifetime =
      // eslint-disable-next-line security/detect-object-injection
      (token as StaticInjectable)[STATIC_INJECTION_LIFETIME] ??
      Lifetime.Transient;
    // eslint-disable-next-line security/detect-object-injection
    const injections = (token as StaticInjectable)[STATIC_INJECTIONS] ?? [];
    const arguments_ = await this.createArgsAsync(
      { injections } as Registration,
      scope,
    );

    const instance = this.createInstance(token, arguments_);

    // If the lifetime is scoped, store the instance in the scope.
    if (lifetime === Lifetime.Scoped) {
      if (scope === undefined) {
        throw new UndefinedScopeError(token);
      }
      scope.registerRegistration(token, {
        injections,
        instance,
        options: { lifetime },
        provider: { useClass: token },
        providerType: ProvidersType.ClassProvider,
      });
    }

    this.register(token, { useClass: token }, { lifetime });

    // If the lifetime is singleton, store the instance in the registration.
    if (lifetime == Lifetime.Singleton) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.getRegistration(token)!.instance = instance;
    }
    return instance;
  }
  /**
   * Resolves a class provider to an instance.
   * @param registration - The registration of the provider.
   * @param token - The token of the provider.
   * @param scope - Optional scope to resolve the token in.
   * @returns The resolved instance.
   */
  private resolveClassProvider<T>(
    registration: Registration,
    token: InjectionToken,
    scope?: IScopeContext,
  ): T {
    // If the lifetime is scoped, store the instance in the scope.
    if (
      registration.options.lifetime === Lifetime.Scoped &&
      scope === undefined
    ) {
      throw new UndefinedScopeError(token);
    }
    // If the lifetime is singleton, store the instance in the registration.
    if (
      registration.options.lifetime === Lifetime.Singleton ||
      registration.options.lifetime === Lifetime.Scoped
    ) {
      if (registration.instance === undefined) {
        registration.instance = this.createInstance(
          (registration.provider as ClassProvider<T>).useClass,
          // Create the arguments for the class.
          this.createArgs(registration, scope),
        );
      }
      return registration.instance;
    }
    // If the lifetime is transient, create a new instance every time.
    return this.createInstance(
      (registration.provider as ClassProvider<T>).useClass,
      // Create the arguments for the class.
      this.createArgs(registration, scope),
    );
  }
  /**
   * Resolves a class provider to an instance asynchronously.
   * @param registration - The registration to resolve.
   * @param token - The token to resolve.
   * @param scope - Optional scope to resolve the token in.
   * @returns The resolved instance.
   */
  private async resolveClassProviderAsync<T>(
    registration: Registration,
    token: InjectionToken,
    scope?: IScopeContext,
  ): Promise<T> {
    // If the lifetime is scoped, store the instance in the scope.
    if (
      registration.options.lifetime === Lifetime.Scoped &&
      scope === undefined
    ) {
      throw new UndefinedScopeError(token);
    }
    // If the lifetime is singleton, store the instance in the registration.
    if (
      registration.options.lifetime === Lifetime.Singleton ||
      registration.options.lifetime === Lifetime.Scoped
    ) {
      if (registration.instance === undefined) {
        registration.instance = this.createInstance(
          (registration.provider as ClassProvider<T>).useClass,
          // Create the arguments for the class.
          await this.createArgsAsync(registration, scope),
        );
      }
      return registration.instance;
    }
    // If the lifetime is transient, create a new instance every time.
    return this.createInstance(
      (registration.provider as ClassProvider<T>).useClass,
      // Create the arguments for the class.
      await this.createArgsAsync(registration, scope),
    );
  }
  /**
   * Resolves a factory provider to an instance.
   * @param registration - The registration to resolve.
   * @returns The resolved instance.
   */
  private resolveFactoryProvider<T>(
    registration: Registration,
    scope?: IScopeContext,
  ): T {
    return (registration.provider as FactoryProvider<T>).useFactory(
      ...this.createArgs(registration, scope),
    ) as T;
  }
  /**
   * Resolves a factory provider to an instance asynchronously.
   * @param registration - The registration to resolve.
   * @returns The resolved instance.
   */
  private async resolveFactoryProviderAsync<T>(
    registration: Registration,
    scope?: IScopeContext,
  ): Promise<T> {
    // The factory provider is resolved by calling its useFactory method with the container as an argument.
    // The useFactory method should return a promise that resolves to the instance.
    return (registration.provider as FactoryProvider<T>).useFactory(
      ...(await this.createArgsAsync(registration, scope)),
    ) as T;
  }
  /**
   * Resolves a registration to an instance.
   * @param token - The token of the registration to resolve.
   * @param registration - The registration to resolve.
   * @param scope - The scope to resolve the registration in.
   * @returns The resolved instance.
   */
  private resolveRegistration<T>(
    token: InjectionToken,
    registration?: Registration<T>,
    scope?: IScopeContext,
  ): T {
    /**
     * If the registration is a class provider or a constructor provider, resolve it to an instance.
     * Otherwise, resolve it to an instance using the factory provider or the value provider.
     */
    switch (registration?.providerType) {
      case ProvidersType.ClassProvider:
      case ProvidersType.ConstructorProvider: {
        return this.resolveClassProvider(registration, token, scope);
      }
      case ProvidersType.FactoryProvider: {
        return this.resolveFactoryProvider(registration, scope);
      }
      case ProvidersType.TokenProvider: {
        return this.resolve(
          (registration.provider as TokenProvider<T>).useToken,
          scope,
        );
      }
      case ProvidersType.ValueProvider: {
        return this.resolveValueProvider(registration);
      }
      default: {
        throw new Error(
          `Invalid registration type: "${registration?.providerType}"`,
        );
      }
    }
  }
  /**
   * Resolves a registration asynchronously.
   * @param token - The token of the registration to resolve.
   * @param registration - The registration to resolve.
   * @param scope - The scope to resolve the registration in.
   * @returns The resolved instance.
   */
  private async resolveRegistrationAsync<T>(
    token: InjectionToken,
    registration: Registration<T>,
    scope?: IScopeContext,
  ): Promise<T> {
    // If the registration is a class provider or a constructor provider, resolve it to an instance asynchronously.
    // Otherwise, resolve it to an instance using the factory provider or the value provider asynchronously.
    switch (registration.providerType) {
      case ProvidersType.ClassProvider:
      case ProvidersType.ConstructorProvider: {
        return this.resolveClassProviderAsync(registration, token, scope);
      }
      case ProvidersType.FactoryProvider: {
        return this.resolveFactoryProviderAsync(registration, scope);
      }
      case ProvidersType.TokenProvider: {
        return this.resolveAsync(
          (registration.provider as TokenProvider<T>).useToken,
          scope,
        );
      }
      case ProvidersType.ValueProvider: {
        return this.resolveValueProvider(registration);
      }
      default: {
        throw new Error(
          `Invalid registration type: "${registration.providerType}"`,
        );
      }
    }
  }
  /**
   * Resolves a value provider to an instance.
   * @param registration - The registration of the value provider.
   * @returns The resolved instance.
   */
  private resolveValueProvider<T>(registration: Registration): T {
    // The value provider is resolved by returning its useValue property.
    return (registration.provider as ValueProvider<T>).useValue;
  }
}

export const container: IContainer = new Container();
