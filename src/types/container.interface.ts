import type { ConstructorType } from "./constructor.type.ts";
import type { InjectionToken } from "./injection-token.type.ts";
import type {
  ClassProvider,
  FactoryFunction,
  Provider,
  TokenProvider,
} from "./providers/index.ts";
import type {
  Registration,
  RegistrationOptions,
} from "./registration.interface.ts";
import type { IScopeContext } from "./scope-context.interface.ts";

export interface IContainer
  extends IContainerClear,
    IContainerCreate,
    IContainerRegistration,
    IContainerResolve {
  //readonly scopes: Set<IScopeContext>;
}

export interface IContainerClear extends AsyncDisposable {
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
  clearInstances(): Promise<void>;

  /**
   * Resets the container by clearing all registrations and disposing all scopes.
   * This method is useful for testing, as it allows you to clear out all registrations
   * and scopes, so you can start from a clean slate.
   * @returns A promise that resolves when all registrations and scopes have been cleared.
   * NOTE: don't clean child containers
   */
  dispose(): Promise<void>;

  /**
   * Removes all registrations that match the predicate from the container.
   * If no predicate is specified, all registrations are removed.
   * @param token - The token to remove registrations from
   * @param predicate - A function that takes a Registration and returns a boolean indicating whether the registration should be removed
   * @returns The container used for the removal
   */
  removeRegistration<T>(
    token: InjectionToken<T>,
    predicate?: (registration: Registration<T>) => boolean,
  ): Promise<IContainer>;
}

export interface IContainerCreate {
  /**
   * Creates a new child container.
   *
   * The child container will have a reference to the current container as its parent.
   * The child container is also stored in the current container, so it can be properly disposed when the parent container is disposed.
   *
   * @returns The new child container.
   */
  createChildContainer(): IContainer;

  /**
   * Creates a new scope.
   *
   * A scope is used to separate registrations into different groups.
   * Each scope has its own set of registrations, which are stored
   * in the scope's `services` property.
   *
   * @returns The new scope.
   */
  createScope(): IScopeContext;
}

export interface IContainerRegistration {
  /**
   * Registers a class as a scoped in the container.
   * @param target - The class to register.
   * @param injections - An array of tokens to inject into the class constructor.
   * @returns The container used for the registration.
   */
  addScoped<T>(
    target: ConstructorType<T>,
    injections?: Array<InjectionToken>,
  ): IContainer;
  /**
   * Registers a class as a singleton in the container.
   * @param target - The class constructor to register.
   * @param injections - Optional tokens to inject into the class constructor.
   * @returns The container instance used for registration.
   */
  addSingleton<T>(
    target: ConstructorType<T>,
    injections?: Array<InjectionToken>,
  ): IContainer;
  /**
   * Registers a class as a transient in the container.
   * @param target - The class constructor to register.
   * @param injections - Optional tokens to inject into the class constructor.
   * @returns The container instance used for registration.
   */
  addTransient<T>(
    target: ConstructorType<T>,
    injections?: Array<InjectionToken>,
  ): IContainer;

  /**
   * Gets the registration for the specified token.
   * @param token - The token to get the registration for.
   * @returns The registration or undefined if not found.
   */
  get<T>(token: InjectionToken<T>): Registration<T> | undefined;

  /**
   * Checks if a registration exists for the specified token.
   * @param token - The token to check for.
   * @returns `true` if a registration exists, `false` otherwise.
   */
  has<T>(token: InjectionToken<T>): boolean;

  register<T>(
    token: InjectionToken<T>,
    provider: ConstructorType<T> | Provider<T>,
    options?: RegistrationOptions,
  ): IContainer;

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
    injections?: Array<InjectionToken>,
  ): IContainer;

  /**
   * Registers an instance of a class with the specified token.
   * This registration is a singleton, meaning that the same instance
   * will be returned each time the token is resolved.
   * @param token - The token to register the instance with.
   * @param instance - The instance to register.
   * @returns The container used for the registration
   */
  registerInstance<T>(token: InjectionToken<T>, instance: T): IContainer;

  /**
   * Registe a registration object directly
   * @param token - The token to register
   * @param registration - The registration object
   * @returns The container used for the registration
   */
  registerRegistration<T>(
    token: InjectionToken<T>,
    registration: Registration,
  ): IContainer;

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
    injections?: Array<InjectionToken>,
  ): IContainer;

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
    injections?: Array<InjectionToken>,
  ): IContainer;

  /**
   * Registers a class as a transient in the container.
   * @param token - The token to register the class with.
   * @param target - The class to register.
   * @param injections - An array of tokens to inject into the class constructor.
   * @returns The container used for the registration.
   */
  registerTransient<T>(
    token: InjectionToken<T>,
    target: ClassProvider<T> | ConstructorType<T>,
    injections?: Array<InjectionToken>,
  ): IContainer;

  /**
   * Registers a token to redirect to another token, 'to' must exist before registration
   * @param from - The token to be registered
   * @param to - The token to where the from token will redirect to
   * @returns The container used for the registration
   */
  registerType<T>(
    from: InjectionToken<T>,
    to: InjectionToken<T> | TokenProvider<T>,
  ): IContainer;

  /**
   * Registers a value with the specified token in the container.
   * This registration is a singleton, meaning that the same value
   * will be returned each time the token is resolved.
   * @param token - The token to register the value with.
   * @param value - The value to register.
   * @returns The container used for the registration.
   */
  registerValue<T>(token: InjectionToken<T>, value: T): IContainer;

  /**
   * Removes a registration from the container.
   * @param token - The token to remove the registration from.
   * @param registration - The registration to remove.
   * @returns The container used for the removal.
   */
  remove<T>(
    token: InjectionToken<T>,
    registration: Registration<T>,
  ): Promise<IContainer>;
}

export interface IContainerResolve {
  //#region Resolve

  /**
   * Resolves the specified token to an instance.
   * If the token is already being resolved (i.e. a circular dependency is detected),
   * a proxy is returned instead.
   * @param token - The token to resolve.
   * @returns The resolved instance.
   */
  resolve<T>(token: InjectionToken<T>): T;

  /**
   * Resolves all instances of the specified token.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an array of resolved instances.
   * @param token - The token to resolve.
   * @returns An array of resolved instances.
   */
  resolveAll<T>(token: InjectionToken<T>): Array<T>;

  /**
   * Resolves all instances of the specified token asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an array of resolved instances.
   * @param token - The token to resolve.
   * @returns A promise that resolves with an array of resolved instances.
   */
  resolveAllAsync<T>(token: InjectionToken<T>): Promise<Array<T>>;

  /**
   * Resolves the specified token asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * If the token is already being resolved (i.e. a circular dependency is detected),
   * a proxy is returned instead.
   * @param token - The token to resolve.
   * @returns A promise that resolves with an instance of the type.
   */
  resolveAsync<T>(token: InjectionToken<T>): Promise<T>;

  /**
   * Resolves the specified token with the given arguments.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * @param token - The token to resolve.
   * @param args - Optional arguments to pass to the constructor.
   * @returns An instance of the type.
   */
  resolveWithArgs<T>(token: InjectionToken<T>, arguments_?: Array<unknown>): T;

  /**
   * Resolves the specified token with the given arguments asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * @param token - The token to resolve.
   * @param args - Optional arguments to pass to the constructor.
   * @returns A promise that resolves with an instance of the type.
   */
  resolveWithArgsAsync<T>(
    token: InjectionToken<T>,
    arguments_?: Array<unknown>,
  ): Promise<T>;

  //#endregion Resolve
}
