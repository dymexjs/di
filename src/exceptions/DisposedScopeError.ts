export class DisposedScopeError extends Error {
  constructor(message?: string) {
    super(message ?? "The scope has been disposed.");
  }
}
