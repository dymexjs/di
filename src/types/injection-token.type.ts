import type { ConstructorType } from "./constructor.type.ts";
import type { InterfaceId } from "./decorators.type.ts";

export class Token {
  constructor(public token?: string | symbol) {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InjectionToken<T = any> = string | symbol | ConstructorType<T> | Token | InterfaceId<T>;

export function isNormalToken(token?: InjectionToken): token is string | symbol {
  return typeof token === "string" || typeof token === "symbol";
}
