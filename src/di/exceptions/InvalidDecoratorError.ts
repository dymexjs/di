import { isConstructorType } from "../types/constructor.type";

export class InvalidDecoratorError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(decorator: string, target: any) {
    super(
      `Decorator '${decorator}' found on '"${isConstructorType(target) ? target.name : target}"' can only be used in a class.`,
    );
  }
}
