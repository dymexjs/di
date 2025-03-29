import type { IContainerResolve } from "./container.interface.ts";
import type { InjectionToken } from "./injection-token.type.ts";
import type { Registration } from "./registration.interface.ts";

export interface IScopeContext extends AsyncDisposable, IContainerResolve {
  /**
   * Disposes the scope by clearing all registrations.
   * This method is useful for testing, as it allows you to clear out all registrations,
   * so you can start from a clean slate.
   * @returns A promise that resolves when all registrations have been cleared.
   */
  dispose(): Promise<void>;

  getAllRegistrations<T>(token: InjectionToken<T>): Array<Registration>;

  getRegistration(token: InjectionToken): Registration | undefined;

  registerRegistration(
    token: InjectionToken,
    registration: Registration,
  ): IScopeContext;
}
