import { isAsyncDisposable, isDisposable } from "./helpers";
import { InjectionToken } from "./types/injection-token";
import { Registration } from './types/registration';

export class ServiceMap<K extends InjectionToken, V extends Registration> implements AsyncDisposable {
    private readonly _services = new Map<K, Array<V>>();

    public ensuresKey(key: K) {
        if (!this._services.has(key)) {
            this._services.set(key, []);
        }
    }
    public getAll(key: K): Array<V> {
        this.ensuresKey(key);
        return this._services.get(key)!;
    }
    public entries(): IterableIterator<[K, Array<V>]> {
        return this._services.entries();
    }

    public get(key: K): V {
        this.ensuresKey(key);
        const value = this._services.get(key)!;
        return value[value.length - 1];
    }

    public set(key: K, value: V): void {
        this.ensuresKey(key);
        this._services.get(key)!.push(value);
    }

    public setAll(key: K, value: Array<V>): void {
        this._services.set(key, value);
    }

    public has(key: K): boolean {
        this.ensuresKey(key);
        return this._services.get(key)!.length > 0;
    }
    public clear(){
        this._services.clear();
    }

    public async delete(key: K, registration: V): Promise<void> {
        this.ensuresKey(key);
        if(isAsyncDisposable(registration.instance)) {
            await registration.instance[Symbol.asyncDispose]();
        }else if(isDisposable(registration.instance)) {
            registration.instance[Symbol.dispose]();
        }
        const index = this._services.get(key)!.indexOf(registration);
        this._services.get(key)!.splice(index, 1);
    }

    async [Symbol.asyncDispose](){
        for (const [token, registrations] of this._services.entries()) {
            await Promise.all(registrations.filter((r) => isAsyncDisposable(r)).map((r) => r[Symbol.asyncDispose]()));
            registrations.filter((r) => isDisposable(r)).map((r) => r[Symbol.dispose]());
        }
        this._services.clear();
    }
}
