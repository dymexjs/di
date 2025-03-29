import { isConstructorType } from "../types/constructor.type.ts";

export class InvalidDecoratorError extends Error {
  constructor(
    decorator: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    message = "can only be used in a class",
  ) {
    super(
      `Decorator '${decorator}' found on '"${isConstructorType(target) ? target.name : target.toString()}"' ${message}.`,
    );
    this.name = "InvalidDecoratorError";
  }
}
