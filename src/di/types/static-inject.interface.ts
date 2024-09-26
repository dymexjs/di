import { STATIC_INJECTIONS, STATIC_INJECTION_LIFETIME } from "../constants";
import { InjectionToken } from "./injection-token.type";
import { Lifetime } from "./registration.interface";

interface StaticInject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): any;
  [STATIC_INJECTIONS]?: InjectionToken[];
  [STATIC_INJECTION_LIFETIME]?: Lifetime;
}

export type StaticInjectable<I extends StaticInject = StaticInject> =
  InstanceType<I>;
