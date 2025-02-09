import type { Container } from "./container.ts";
import { DisposedScopeError } from "./exceptions/DisposedScopeError.ts";
import { isAsyncDisposable, isDisposable } from "./helpers.ts";
import { ServiceMap } from "./service-map.ts";
import type { InjectionToken } from "./types/injection-token.type.ts";
import type { Registration } from "./types/registration.interface.ts";
import type { IScopeContext } from "./types/scope-context.interface.ts";

export class ScopeContext implements IScopeContext {
  #_isDisposed = false;
  #_services = new ServiceMap<InjectionToken, Registration>();
  #_container: Container;

  constructor(cont: Container) {
    this.#_container = cont;
  }

  get services(): ServiceMap<InjectionToken, Registration> {
    return this.#_services;
  }

  private checkDisposed() {
    if (this.#_isDisposed) {
      throw new DisposedScopeError();
    }
  }

  resolve<T>(token: InjectionToken<T>): T {
    this.checkDisposed();
    if (this.#_services.has(token)) {
      return this.#_services.get(token).instance as T;
    }
    return this.#_container.resolve(token, this);
  }

  resolveAll<T>(token: InjectionToken<T>): Array<T> {
    this.checkDisposed();
    if (this.#_services.has(token)) {
      return this.#_services.getAll(token).map((r) => r.instance as T);
    }
    return this.#_container.resolveAll(token, this);
  }
  async resolveAllAsync<T>(token: InjectionToken<T>): Promise<Array<T>> {
    this.checkDisposed();
    if (this.#_services.has(token)) {
      return this.#_services.getAll(token).map((r) => r.instance as T);
    }
    return this.#_container.resolveAllAsync(token, this);
  }
  async resolveAsync<T>(token: InjectionToken<T>): Promise<T> {
    this.checkDisposed();
    if (this.#_services.has(token)) {
      return this.#_services.get(token).instance as T;
    }
    return this.#_container.resolveAsync(token, this);
  }
  resolveWithArgs<T>(token: InjectionToken<T>, args?: Array<unknown>): T {
    this.checkDisposed();
    return this.#_container.resolveWithArgs(token, args, this);
  }
  resolveWithArgsAsync<T>(
    token: InjectionToken<T>,
    args?: Array<unknown>,
  ): Promise<T> {
    this.checkDisposed();
    return this.#_container.resolveWithArgsAsync(token, args, this);
  }

  async dispose(): Promise<void> {
    return this[Symbol.asyncDispose]();
  }

  async [Symbol.asyncDispose]() {
    this.checkDisposed();
    for (const registrations of this.services.values()) {
      await Promise.all(
        registrations
          .filter((r) => isAsyncDisposable(r))
          .map((r) => r[Symbol.asyncDispose]()),
      );
      registrations
        .filter((r) => isDisposable(r))
        .map((r) => r[Symbol.dispose]());
    }
    this.services.clear();
    this.#_isDisposed = true;
  }
}
