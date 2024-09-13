import { InjectionToken } from "../types/InjectionToken";

export class TokenRegistrationCycleError extends Error{
    constructor(path: Array<InjectionToken<any>>) {
        super(`Token registration cycle detected! "${[...path].join(" -> ")}"`);    
    }
}