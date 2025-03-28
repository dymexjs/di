import type { InjectionToken } from "../types/injection-token.type.ts";

import { isConstructorType } from "../types/constructor.type.ts";

export class UndefinedScopeError extends Error {
  constructor(token: InjectionToken) {
    super(
      `Undefined Scope when resolving: "${isConstructorType(token) ? token.name : token.toString()}"`,
    );
    this.name = "UndefinedScopeError";
  }
}
