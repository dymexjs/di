// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConstructorType<T> = new (...args: Array<any>) => T;

export function isConstructorType(
  token?: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): token is ConstructorType<any> {
  return typeof token === "function";
}
