import { isAsyncDisposable, isDisposable } from "./helpers.ts";
import { ServiceMap } from "./service-map.ts";
import type { InjectionToken } from "./types/injection-token.type.ts";
import type { Registration } from "./types/registration.interface.ts";

export class ScopeContext implements AsyncDisposable {
  public readonly services = new ServiceMap<InjectionToken, Registration>();

  async [Symbol.asyncDispose]() {
    for (const registrations of this.services.values()) {
      await Promise.all(registrations.filter((r) => isAsyncDisposable(r)).map((r) => r[Symbol.asyncDispose]()));
      registrations.filter((r) => isDisposable(r)).map((r) => r[Symbol.dispose]());
    }
    this.services.clear();
  }
}
