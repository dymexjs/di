
export type ConstructorType<T> = new (...args: Array<any>) => T;



export function isConstructorType(token?: unknown): token is ConstructorType<any> {
    return typeof token === "function";
}
