import { Registration, RegistrationOptions } from "./registration";
import { InjectionToken } from "./injection-token";
import { ConstructorType } from "./constructor.type";
import { ScopeContext } from "../scope-context";
import { TokenProvider } from "./providers/token-provider";
import { Provider } from "./providers/provider";

export interface IContainer extends AsyncDisposable {
    readonly scopes: Set<ScopeContext>;

    /**
     * Clear all the instances
     */
    clearInstances(): Promise<void>;

    /**
     * Create a child container with reference to parent
     * @return The child container
     */
    createChildContainer(): IContainer;

    /**
     * Create and return a scope
     * @return The created scope
     */
    createScope(): ScopeContext;

    /**
     * Dispose a scope and it's contents
     * @param scope scope to be disposed
     */
    disposeScope(scope: ScopeContext): Promise<void>;

    //getAllRegistrations<T>(token: InjectionToken<T>): Array<Registration>;
    //getRegistration(token: InjectionToken): Registration | undefined;

    /**
     * Check if the given dependency is registered
     *
     * @param token The token to check
     * @param recursive Should parent containers be checked?
     * @return Whether or not the token is registered
     */
    //hasRegistration(token: InjectionToken): boolean;

    /**
     * Registe a provider with the given token
     * @param token The token to register
     * @param provider The provider to be registered
     * @param options options for the registration @see RegistrationOptions
     * @return The container used for the registration
     */
    register<T>(
        token: InjectionToken,
        provider: Provider<T> | ConstructorType<T>,
        options?: RegistrationOptions,
    ): IContainer;
    /**
     * Registe an instance with the given token, the instance will be
     * registered with @see ValueProvider
     * @param token The token to register
     * @param instance The instance to be registered
     * @return The container used for the registration
     */
    registerInstance<T>(token: InjectionToken, instance: T): IContainer;

    /**
     * Registe a registration object directly
     * @param token The token to register
     * @param registration The registration object
     * @return The container used for the registration
     */
    registerRegistration(token: InjectionToken, registration: Registration<any>): IContainer;

    /**
     * Register a token to redirect to another token, 'to' must exist before registration
     * @param from The token to be registered
     * @param to The token to where the from token will redirect to
     * @return The container used for the registration
     */
    registerType<T>(from: InjectionToken, to: InjectionToken<T> | TokenProvider<T>): IContainer;


    removeRegistration<T>(token: InjectionToken, predicate?: (registration: Registration<T>) => boolean): Promise<IContainer>;

    /**
     * Clears all registered tokens, scopes and instances
     * NOTE: don't clean child containers
     */
    reset(): Promise<void>;

    /**
     * Resolve a token into an instance
     *
     * @param token The dependency token
     * @param scope The scope where to resolve
     * @return An instance of the dependency
     */
    resolve<T>(token: InjectionToken, scope?: ScopeContext): T;

    /**
     * Resolve all the instances registered with a token
     *
     * @param token The dependency token
     * @param scope The scope where to resolve
     * @return All the instances of the dependency
     */
    resolveAll<T>(token: InjectionToken, scope?: ScopeContext): Array<T>;

    /**
     * Resolve all the instances registered with a token
     *
     * @param token The dependency token
     * @param scope The scope where to resolve
     * @return All the instances of the dependency
     */
    resolveAllAsync<T>(token: InjectionToken, scope?: ScopeContext): Promise<Array<T>>;

    /**
     * Resolve a token into an instance
     *
     * @param token The dependency token
     * @param scope The scope where to resolve
     * @return An instance of the dependency
     */
    resolveAsync<T>(token: InjectionToken, scope?: ScopeContext): Promise<T>;

    resolveWithArgs<T>(token: InjectionToken, args?: Array<unknown>, scope?: ScopeContext): T; 
    resolveWithArgsAsync<T>(token: InjectionToken, args?: Array<unknown>, scope?: ScopeContext): Promise<T>;
}
