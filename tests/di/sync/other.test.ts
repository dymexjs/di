import { beforeEach, describe, expect, test } from "@jest/globals";
import { Container, container } from "../../../src/di/container";
import { TokenNotFoundError } from "../../../src/di/exceptions/TokenNotFoundError";
import { Lifetime } from "../../../src/di/types/registration";
import { Singleton } from "../../../src/di/decorators";
import { TokenRegistrationCycleError } from "../../../src/di/exceptions/TokenRegistrationCycleError";

describe("Averix_DI ", () => {
    beforeEach(async () => container.reset());
    describe("sync", () => {
        describe("other", () => {
            describe("register and resolve", () => {
                test("should throw an error when token not registered", () => {
                    expect(() => container.resolve("test")).toThrow(TokenNotFoundError);
                });
            });
            describe("direct resolve", () => {
                test("should resolve directly in constructor param", () => {
                    @Singleton()
                    class Test {}
                    @Singleton()
                    class Test2 {
                        constructor(public readonly test: Test = container.resolve(Test)) {}
                    }
                    const test2 = container.resolve(Test2);
                    const test = container.resolve(Test);
                    expect(test2).toBeInstanceOf(Test2);
                    expect(test).toBeInstanceOf(Test);
                    expect(test2.test).toBeInstanceOf(Test);
                    expect(test2.test).toBe(test);
                });
            });
            describe("resolveAll", () => {
                test("fails to resolveAll unregistered dependency by name sync", () => {
                    expect(() => container.resolveAll("NotRegistered")).toThrow(TokenNotFoundError);
                });
                test("resolves an array of transient instances bound to a single interface", () => {
                    interface FooInterface {
                        bar: string;
                    }

                    class FooOne implements FooInterface {
                        public bar = "foo1";
                    }

                    class FooTwo implements FooInterface {
                        public bar = "foo2";
                    }

                    container.register<FooInterface>("FooInterface", { useClass: FooOne });
                    container.register<FooInterface>("FooInterface", { useClass: FooTwo });

                    const fooArray = container.resolveAll<FooInterface>("FooInterface");
                    expect(Array.isArray(fooArray)).toBeTruthy();
                    expect(fooArray[0]).toBeInstanceOf(FooOne);
                    expect(fooArray[1]).toBeInstanceOf(FooTwo);
                });

                test("resolves all transient instances when not registered", () => {
                    class Foo {}

                    const foo1 = container.resolveAll(Foo);
                    const foo2 = container.resolveAll(Foo);

                    expect(Array.isArray(foo1)).toBeTruthy();
                    expect(Array.isArray(foo2)).toBeTruthy();
                    expect(foo1[0]).toBeInstanceOf(Foo);
                    expect(foo2[0]).toBeInstanceOf(Foo);
                    expect(foo1[0]).not.toBe(foo2[0]);
                });
            });
            describe("Child Container", () => {
                test("should create a child container", () => {
                    const childContainer = container.createChildContainer();
                    expect(childContainer).toBeInstanceOf(Container);
                });
                test("should resolve in child container", () => {
                    const childContainer = container.createChildContainer();
                    childContainer.register("test", { useValue: "test" });
                    expect(childContainer.resolve("test")).toBe("test");
                    expect(() => container.resolve("test")).toThrow(TokenNotFoundError);
                });
                test("should resolve in parent container", () => {
                    const childContainer = container.createChildContainer();
                    container.register("test", { useValue: "test" });
                    expect(container.resolve("test")).toBe("test");
                    expect(childContainer.resolve("test")).toBe("test");
                });
                test("should resolve scoped", () => {
                    class Test {
                        propertyA = "test";
                    }
                    container.register("test", Test, { lifetime: Lifetime.Scoped });
                    const childContainer = container.createChildContainer();
                    const scope = childContainer.createScope();
                    expect(childContainer.resolve<Test>("test", scope).propertyA).toBe("test");
                });
                test("child container resolves even when parent doesn't have registration", () => {
                    interface IFoo {}
                    class Foo implements IFoo {}
                    const childContainer = container.createChildContainer();
                    childContainer.register("IFoo", { useClass: Foo });
                    expect(childContainer.resolve<Foo>("IFoo")).toBeInstanceOf(Foo);
                });
                test("child container resolves using parent's registration when child container doesn't have registration", () => {
                    interface IFoo {}
                    class Foo implements IFoo {}
                    container.register("IFoo", { useClass: Foo });
                    const childContainer = container.createChildContainer();
                    expect(childContainer.resolve<Foo>("IFoo")).toBeInstanceOf(Foo);
                });
                test("child container resolves all even when parent doesn't have registration", () => {
                    interface IFoo {}
                    class Foo implements IFoo {}
                    const childContainer = container.createChildContainer();
                    childContainer.register("IFoo", { useClass: Foo });
                    const myFoo = childContainer.resolveAll<IFoo>("IFoo");
                    expect(myFoo).toBeInstanceOf(Array);
                    expect(myFoo).toHaveLength(1);
                    expect(myFoo[0]).toBeInstanceOf(Foo);
                });

                test("child container resolves all using parent's registration when child container doesn't have registration", () => {
                    interface IFoo {}
                    class Foo implements IFoo {}
                    container.register("IFoo", { useClass: Foo });
                    const childContainer = container.createChildContainer();
                    const myFoo = childContainer.resolveAll<IFoo>("IFoo");
                    expect(myFoo).toBeInstanceOf(Array);
                    expect(myFoo).toHaveLength(1);
                    expect(myFoo[0]).toBeInstanceOf(Foo);
                });
                test("should not create a new instance of requested singleton service", () => {
                    @Singleton()
                    class Bar {}

                    const bar1 = container.resolve(Bar);

                    expect(bar1).toBeInstanceOf(Bar);

                    const childContainer = container.createChildContainer();
                    const bar2 = childContainer.resolve(Bar);

                    expect(bar2).toBeInstanceOf(Bar);
                    expect(bar1).toBe(bar2);
                });
            });
            describe("registerType", () => {
                test("registerType() allows for classes to be swapped", () => {
                    class Bar {}
                    class Foo {}
                    container.registerType(Bar, Foo);

                    expect(container.resolve(Bar)).toBeInstanceOf(Foo);
                });

                test("registerType() allows for names to be registered for a given type", () => {
                    class Bar {}
                    container.registerType("CoolName", Bar);

                    expect(container.resolve("CoolName")).toBeInstanceOf(Bar);
                });

                test("registerType() doesn't allow tokens to point to themselves", () => {
                    expect(() => container.registerType("Bar", "Bar")).toThrow(TokenRegistrationCycleError);
                });

                test("registerType() doesn't allow registration cycles", () => {
                    container.registerType("Bar", "Foo");
                    container.registerType("Foo", "FooBar");

                    expect(() => container.registerType("FooBar", "Bar")).toThrow(TokenRegistrationCycleError);
                });
            });
        });
    });
});
