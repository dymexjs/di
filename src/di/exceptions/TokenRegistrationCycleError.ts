import { InjectionToken } from "../types/injection-token";

export class TokenRegistrationCycleError extends Error {
  constructor(path: Array<InjectionToken>) {
    super(`Token registration cycle detected! "${[...path].join(" -> ")}"`);
  }
}
