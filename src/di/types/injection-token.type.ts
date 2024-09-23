import { ConstructorType } from "./constructor.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InjectionToken<T = any> = string | symbol | ConstructorType<T>;

export function isNormalToken(token?: InjectionToken): token is string | symbol {
  return typeof token === "string" || typeof token === "symbol";
}
