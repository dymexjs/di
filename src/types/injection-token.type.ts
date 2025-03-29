import type { ConstructorType } from "./constructor.type.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InjectionToken<T = any> =
  | ConstructorType<T>
  | string
  | symbol
  | Token;

export class Token {
  protected _token?: string | symbol;

  constructor(token?: string | symbol) {
    this._token = token;
  }

  toString(): string {
    return this._token ? this._token.toString() : "";
  }
}

export function isNormalToken(
  token?: InjectionToken,
): token is string | symbol {
  return typeof token === "string" || typeof token === "symbol";
}
