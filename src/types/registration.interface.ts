import type { Provider } from "./providers/provider.type.ts";
import { ProvidersType } from "./providers/provider.type.ts";
import type { InjectionToken } from "./injection-token.type.ts";

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

export interface RegistrationOptions {
  lifetime: Lifetime;
  injections?: Array<InjectionToken>;
}
