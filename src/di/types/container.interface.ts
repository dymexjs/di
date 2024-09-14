import { Registration, RegistrationOptions } from "./registration";
import { InjectionToken } from "./injection-token";
import { ConstructorType } from "./constructor.type";
import { ScopeContext } from "../scope-context";
import { TokenProvider } from "./providers/token-provider";
import { Provider } from "./providers/provider";

export interface IContainer {
    readonly scopes: Set<ScopeContext>;
    clearInstances(): void;
    createChildContainer(): IContainer
    createScope(): ScopeContext;
    createInstance<T>(implementation: ConstructorType<T>): T;
    disposeScope(scope: ScopeContext): void;
    getAllRegistrations<T>(token: InjectionToken<T>): Array<Registration>;
    getRegistration(token: InjectionToken, recursive?: boolean): Registration | undefined;
    hasRegistration(token: InjectionToken, recursive?: boolean): boolean;
    register<T>(
        token: InjectionToken,
        provider: Provider<T> | ConstructorType<T>,
        options?: RegistrationOptions,
    ): IContainer;
    registerInstance<T>(token: InjectionToken, instance: T): IContainer;
    registerRegistration(token: InjectionToken, registration: Registration<any>): IContainer;
    registerType<T>(from: InjectionToken, to: InjectionToken<T> | TokenProvider<T>): IContainer
    resolve<T>(token: InjectionToken, scope?: ScopeContext): T;
    resolveAll<T>(token: InjectionToken, scope?: ScopeContext): Array<T>;
    resolveAsync<T>(token: InjectionToken, scope?: ScopeContext): Promise<T>;
    resolveAllAsync<T>(token: InjectionToken, scope?: ScopeContext): Promise<Array<T>>;
    reset(): void;
}
