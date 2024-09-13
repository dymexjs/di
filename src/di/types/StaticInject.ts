import { STATIC_INJECT_KEY, STATIC_INJECT_LIFETIME } from "../constants";
import { InjectionToken } from "./InjectionToken";
import { Lifetime } from "./Registration";

interface StaticInject {
    new (...args: Array<any>): any;
    [STATIC_INJECT_KEY]?: Array<InjectionToken>;
    [STATIC_INJECT_LIFETIME]?: Lifetime;
}

export type StaticInjectable<I extends StaticInject = StaticInject> = InstanceType<I>;