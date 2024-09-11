import { ValueProvider } from "./providers/ValueProvider";
import { ClassProvider } from "./providers/ClassProvider";
import { FactoryProvider } from "./providers/FactoryProvider";
import { Registration, RegistrationOptions } from "./Registration";
import { InjectionToken } from "./InjectionToken";
import { ConstructorType } from "./ConstructorType";

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
    staticInject<T>(ctor: ConstructorType<T>): T;
    staticInjectAsync<T>(ctor: ConstructorType<T>): Promise<T>;
}
