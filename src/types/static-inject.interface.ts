import { STATIC_INJECTIONS, STATIC_INJECTION_LIFETIME } from "../constants.ts";
import type { InjectionToken } from "./injection-token.type.ts";
import { Lifetime } from "./registration.interface.ts";

interface StaticInject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: Array<any>): any;
  [STATIC_INJECTIONS]?: Array<InjectionToken>;
  [STATIC_INJECTION_LIFETIME]?: Lifetime;
}

export type StaticInjectable<I extends StaticInject = StaticInject> =
  InstanceType<I>;
