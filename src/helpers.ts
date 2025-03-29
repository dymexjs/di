// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAsyncDisposable(instance?: any): instance is AsyncDisposable {
  return (
    instance !== undefined &&
    Symbol.asyncDispose in instance &&
    typeof instance[Symbol.asyncDispose] === "function"
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDisposable(instance?: any): instance is Disposable {
  return (
    instance !== undefined &&
    Symbol.dispose in instance &&
    typeof instance[Symbol.dispose] === "function"
  );
}
