import { InjectionToken } from "./types/injection-token";


export class ScopeContext {
    private readonly _services: Map<InjectionToken, any> = new Map();
    get services(): Map<InjectionToken, any> {
        return this._services;
    }
}
