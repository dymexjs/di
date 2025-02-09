import type { ServiceMap } from "../service-map.ts";
import type { IContainerResolve } from "./container.interface.ts";
import type { InjectionToken } from "./injection-token.type.ts";
import type { Registration } from "./registration.interface.ts";

export interface IScopeContext extends IContainerResolve, AsyncDisposable {
  get services(): ServiceMap<InjectionToken, Registration>;

  /**
   * Disposes the scope by clearing all registrations.
   * This method is useful for testing, as it allows you to clear out all registrations,
   * so you can start from a clean slate.
   * @returns A promise that resolves when all registrations have been cleared.
   */
  dispose(): Promise<void>;
}
