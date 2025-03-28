import type { InjectionToken } from "./types/injection-token.type.ts";
import type { Registration } from "./types/registration.interface.ts";

import { isAsyncDisposable, isDisposable } from "./helpers.ts";

export class ServiceMap<K extends InjectionToken, V extends Registration>
  implements AsyncDisposable
{
  readonly #_services = new Map<K, Array<V>>();

  public ensuresKey(key: K) {
    if (!this.#_services.has(key)) {
      this.#_services.set(key, []);
    }
  }
  public getAll(key: K): Array<V> {
    this.ensuresKey(key);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.#_services.get(key)!;
  }
  public entries(): IterableIterator<[K, Array<V>]> {
    return this.#_services.entries();
  }
  public values(): MapIterator<Array<V>> {
    return this.#_services.values();
  }
  public get(key: K): V {
    this.ensuresKey(key);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const value = this.#_services.get(key)!;
    return value.at(-1) as V;
  }
  public set(key: K, value: V): void {
    this.ensuresKey(key);
    this.#_services.get(key)?.push(value);
  }
  public setAll(key: K, value: Array<V>): void {
    this.#_services.set(key, value);
  }
  public has(key: K): boolean {
    this.ensuresKey(key);
    return (this.#_services.get(key)?.length ?? 0) > 0;
  }
  public clear() {
    this.#_services.clear();
  }
  public async delete(key: K, registration: V): Promise<void> {
    this.ensuresKey(key);
    if (isAsyncDisposable(registration.instance)) {
      await registration.instance[Symbol.asyncDispose]();
    } else if (isDisposable(registration.instance)) {
      registration.instance[Symbol.dispose]();
    }
    const index = this.#_services.get(key)?.indexOf(registration) as number;
    this.#_services.get(key)?.splice(index, 1);
  }
  async [Symbol.asyncDispose]() {
    const promises: Array<Promise<unknown>> = [];
    for (const values of this.#_services.values()) {
      for (const r of values.filter((r) => isAsyncDisposable(r.instance))) {
        promises.push(r.instance[Symbol.asyncDispose]());
      }
      for (const r of values.filter((r) => isDisposable(r.instance)))
        r.instance[Symbol.dispose]();
    }
    await Promise.allSettled(promises);
    this.#_services.clear();
  }
}
