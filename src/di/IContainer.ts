export interface IContainer {
    register<T>(token: string, value: T): IContainer;
    resolve<T>(token: string): T;
    clear(): void;
}