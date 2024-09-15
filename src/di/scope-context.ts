import { isAsyncDisposable, isDisposable } from "./helpers";
import { ServiceMap } from "./service-map";
import { InjectionToken } from "./types/injection-token";

export class ScopeContext implements AsyncDisposable {
    public readonly services: ServiceMap<InjectionToken, any> = new ServiceMap();

    async [Symbol.asyncDispose]() {
        for (const [token, registrations] of this.services.entries()) {
            await Promise.all(registrations.filter((r) => isAsyncDisposable(r)).map((r) => r[Symbol.asyncDispose]()));
            registrations.filter((r) => isDisposable(r)).map((r) => r[Symbol.dispose]());
        }
        this.services.clear();
    }
}
