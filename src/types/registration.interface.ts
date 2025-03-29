import type { InjectionToken } from "./injection-token.type.ts";
import type { Provider } from "./providers/provider.type.ts";

import { ProvidersType } from "./providers/provider.type.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Registration<T = any> {
  injections: Array<InjectionToken>;
  instance?: T;
  options: RegistrationOptions;
  provider: Provider<T>;
  providerType: ProvidersType;
}

export const Lifetime = {
  Scoped: "Scoped",
  Singleton: "Singleton",
  Transient: "Transient",
} as const;

export type Lifetime = keyof typeof Lifetime;

export interface RegistrationOptions {
  injections?: Array<InjectionToken>;
  lifetime: Lifetime;
}
