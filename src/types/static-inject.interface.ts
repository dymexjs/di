import type { InjectionToken } from "./injection-token.type.ts";

import { STATIC_INJECTION_LIFETIME, STATIC_INJECTIONS } from "../constants.ts";
import { Lifetime } from "./registration.interface.ts";

export type StaticInjectable<I extends StaticInject = StaticInject> =
  InstanceType<I>;

interface StaticInject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...arguments_: Array<any>): any;
  [STATIC_INJECTION_LIFETIME]?: Lifetime;
  [STATIC_INJECTIONS]?: Array<InjectionToken>;
}
