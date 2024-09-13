import { isConstructorType } from "../types/ConstructorType";
import { InjectionToken } from "../types/InjectionToken";

export class UndefinedScopeError extends Error{
    constructor(token: InjectionToken) {
        super(`Undefined Scope when resolving: "${isConstructorType(token) ? token.name : token.toString()}"`);    
    }
}