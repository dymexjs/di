import { isConstructorType } from "../types/constructorType";
import { InjectionToken } from "../types/injectionToken";

export class UndefinedScopeError extends Error{
    constructor(token: InjectionToken) {
        super(`Undefined Scope when resolving: "${isConstructorType(token) ? token.name : token.toString()}"`);    
    }
}