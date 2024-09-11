import { ProvidersType } from "./providers/Provider";

export interface Registration<T = any> {
    providerType: ProvidersType;
    provider: any;
    instance?: T;
    options: RegistrationOptions;
}

export enum Lifetime {
    Singleton,
    Transient,
    Scoped,
}

export type RegistrationOptions = {
    lifetime: Lifetime;
};
