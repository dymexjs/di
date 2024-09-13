import { ValueProvider } from "./providers/valueProvider";
import { ClassProvider } from "./providers/classProvider";
import { FactoryProvider } from "./providers/factoryProvider";
import { Registration, RegistrationOptions } from "./registration";
import { InjectionToken } from "./injectionToken";
import { ConstructorType } from "./constructorType";

export interface IContainer {
    createInstance<T>(implementation: ConstructorType<T>): T;
    getRegistration(token: InjectionToken): Registration | undefined;
    hasRegistration(token: InjectionToken): boolean;
    register<T>(
        token: InjectionToken,
        provider: ValueProvider<T> | ClassProvider<T> | FactoryProvider<T> | ConstructorType<T>,
        options?: RegistrationOptions
    ): IContainer;
    resolve<T>(token: InjectionToken): T;
    resolveAsync<T>(token: InjectionToken): Promise<T>;
    reset(): void;
}
