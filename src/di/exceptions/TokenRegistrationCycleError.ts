import { InjectionToken } from "../types/injection-token";

export class TokenRegistrationCycleError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(path: Array<InjectionToken<any>>) {
    super(`Token registration cycle detected! "${[...path].join(" -> ")}"`);
  }
}
