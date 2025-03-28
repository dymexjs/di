import { type InjectionToken, Token } from "./injection-token.type.ts";

const interfaceTokens = new Map<string, InterfaceToken>();

export type UnwrapDecoratorArguments<T extends Array<InjectionToken>> = {
  [K in keyof T]: T[K] extends string
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : T[K] extends symbol
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      : T[K] extends InjectionToken<infer U>
        ? U
        : never;
};

export class InterfaceToken extends Token {
  constructor(token: string) {
    super(`${token}_interface`);
  }
}

/**
 * Retrieves the interface token associated with the specified interface ID.
 * The token must always be searched and defined at the top most container
 * If the token does not exist, it creates a new one and caches it.
 *
 * @param interfaceId - The identifier of the interface.
 * @returns The InterfaceToken associated with the given interface ID.
 */
export function getInterfaceToken(interfaceId: string): InterfaceToken {
  // Check if the token exists in the parent container and return it if found
  if (!interfaceTokens.has(interfaceId)) {
    interfaceTokens.set(interfaceId, new InterfaceToken(interfaceId));
  }
  return interfaceTokens.get(interfaceId) as InterfaceToken;
}
