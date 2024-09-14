import { InjectionToken } from "./types/injection-token";
import { Registration } from "./types/registration";

export class ServiceMap<K extends InjectionToken, V extends Registration> {
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
}
