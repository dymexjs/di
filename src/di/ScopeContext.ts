import { InjectionToken } from "./types/InjectionToken";


export class ScopeContext {
    private readonly _services: Map<InjectionToken, any> = new Map();
    get services(): Map<InjectionToken, any> {
        return this._services;
    }
}
