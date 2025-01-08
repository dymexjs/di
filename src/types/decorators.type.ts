import type { InjectionToken } from "./injection-token.type.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InterfaceId<T = any> = string & { __type: T };

export type UnwrapDecoratorArgs<T extends Array<InterfaceId | InjectionToken>> = {
  [K in keyof T]: T[K] extends string
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : T[K] extends symbol
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      : T[K] extends InterfaceId<infer U>
        ? U
        : T[K] extends InjectionToken<infer U>
          ? U
          : never;
};
