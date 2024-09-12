import { InjectionToken } from "./InjectionToken";
import { ProvidersType } from "./providers/Provider";

export interface Registration<T = any> {
    providerType: ProvidersType;
    provider: any;
    instance?: T;
    options: RegistrationOptions;
    injections: Array<InjectionToken>;
}

export enum Lifetime {
    Singleton,
    Transient,
    Scoped,
}

export type RegistrationOptions = {
    lifetime: Lifetime;
};
