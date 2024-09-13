import { isConstructorType } from "../types/ConstructorType";

export class InvalidDecoratorError extends Error {
    constructor(decorator: string, target: any) {
        super(`Decorator '${decorator}' found on '"${isConstructorType(target) ? target.name : target.toString()}"' can only be used in a class.`);
    }
}
