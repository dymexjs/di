import type { Container } from "./container.ts";
import type { InjectionToken } from "./types/injection-token.type.ts";
import type { IScopeContext } from "./types/scope-context.interface.ts";

import { DisposedScopeError } from "./exceptions/disposed-scope.error.ts";
import { isAsyncDisposable, isDisposable } from "./helpers.ts";
import { ServiceMap } from "./service-map.ts";
import { Lifetime, type Registration } from "./types/registration.interface.ts";

export class ScopeContext implements IScopeContext {
  #_isDisposed = false;
  #_services = new ServiceMap<InjectionToken, Registration>();
  #_container: Container;

  constructor(cont: Container) {
    this.#_container = cont;
  }

  resolve<T>(token: InjectionToken<T>): T {
    this.checkDisposed();
    this.checkAndSetRegistrations(token);
    return this.#_container.resolve(token, this);
  }
  resolveAll<T>(token: InjectionToken<T>): Array<T> {
    this.checkDisposed();
    this.checkAndSetRegistrations(token);
    return this.#_container.resolveAll(token, this);
  }
  async resolveAllAsync<T>(token: InjectionToken<T>): Promise<Array<T>> {
    this.checkDisposed();
    this.checkAndSetRegistrations(token);
    return this.#_container.resolveAllAsync(token, this);
  }
  async resolveAsync<T>(token: InjectionToken<T>): Promise<T> {
    this.checkDisposed();
    this.checkAndSetRegistrations(token);
    return this.#_container.resolveAsync(token, this);
  }
  resolveWithArgs<T>(token: InjectionToken<T>, arguments_?: Array<unknown>): T {
    this.checkDisposed();
    this.checkAndSetRegistrations(token);
    return this.#_container.resolveWithArgs(token, arguments_, this);
  }
  resolveWithArgsAsync<T>(
    token: InjectionToken<T>,
    arguments_?: Array<unknown>,
  ): Promise<T> {
    this.checkDisposed();
    this.checkAndSetRegistrations(token);
    return this.#_container.resolveWithArgsAsync(token, arguments_, this);
  }
  async dispose(): Promise<void> {
    return this[Symbol.asyncDispose]();
  }
  async [Symbol.asyncDispose]() {
    this.checkDisposed();
    for (const registrations of this.#_services.values()) {
      await Promise.all(
        registrations
          .filter((r) => isAsyncDisposable(r))
          .map((r) => r[Symbol.asyncDispose]()),
      );
      registrations
        .filter((r) => isDisposable(r))
        .map((r) => r[Symbol.dispose]());
    }
    this.#_services.clear();
    this.#_isDisposed = true;
  }
  /**
   * Gets the registration for the specified token.
   * @param token - The token to get the registration for.
   * @returns The registration or undefined if not found.
   */
  getRegistration(token: InjectionToken): Registration | undefined {
    /**
     * If the token is registered in the current container, return the registration.
     */
    if (this.#_services.has(token)) {
      return this.#_services.get(token);
    }

    /**
     * If the token is not registered in any container, return undefined.
     */
    return undefined;
  }
  /**
   * Gets all registrations for the specified token.
   * @param token - The token to get the registrations for.
   * @returns An array of registrations.
   */
  getAllRegistrations<T>(token: InjectionToken<T>): Array<Registration> {
    /**
     * If the token is registered in the current container, return the registrations.
     */
    const regs = this.#_services.getAll(token);
    return regs.length > 0 ? regs : [];
  }
  /**
   * Registe a registration object directly
   * @param token - The token to register
   * @param registration - The registration object
   * @returns The container used for the registration
   */
  registerRegistration(
    token: InjectionToken,
    registration: Registration,
  ): IScopeContext {
    this.#_services.set(token, registration);
    return this;
  }

  private checkDisposed() {
    if (this.#_isDisposed) {
      throw new DisposedScopeError();
    }
  }
  private checkAndSetRegistrations(token: InjectionToken) {
    if (!this.#_services.has(token)) {
      this.#_services.setAll(
        token,
        this.#_container
          .getAllRegistrations(token)
          .filter((r) => r.options.lifetime === Lifetime.Scoped)
          .map((r) => ({
            ...r,
            options: {
              ...r.options,
              lifetime: Lifetime.Scoped,
            },
          })),
      );
    }
  }
}
