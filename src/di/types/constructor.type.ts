// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConstructorType<T> = new (...args: Array<any>) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isConstructorType(
  token?: unknown,
): token is ConstructorType<any> {
  return typeof token === "function";
}
