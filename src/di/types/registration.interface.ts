import { Provider, ProvidersType } from "./providers/provider";
import { InjectionToken } from "./injection-token.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Registration<T = any> {
  providerType: ProvidersType;
  provider: Provider<T>;
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
