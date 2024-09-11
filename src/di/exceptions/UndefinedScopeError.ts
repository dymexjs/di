import { InjectionToken } from "../types";

export class UndefinedScopeError extends Error{
    constructor(token: InjectionToken) {
        super(`Undefined Scope when resolving: "${token.toString()}"`);    
    }
}