import { IContainer } from "./IContainer.js";

class Container implements IContainer {
    private readonly _services: Map<string, any> = new Map();

    register<T>(token: string, value: T): IContainer {
        this._services.set(token, value);
        return this;
    }
    resolve<T>(token: string): T {
        return this._services.get(token);
    }
    clear(): void {
        this._services.clear();
    }
}

export const container = new Container();