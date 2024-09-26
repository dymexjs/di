import { isConstructorType } from "../types/constructor.type";

export class InvalidDecoratorError extends Error {
  constructor(
    decorator: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    message: string = "can only be used in a class",
  ) {
    super(
      `Decorator '${decorator}' found on '"${isConstructorType(target) ? target.name : target.toString()}"' ${message}.`,
    );
  }
}
