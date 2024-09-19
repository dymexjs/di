import { describe, test, expect, beforeEach } from "@jest/globals";
import { container, Container } from "../../src/di/container";
import { TokenNotFoundError } from "../../src/di/exceptions/TokenNotFoundError";
import { STATIC_INJECT_LIFETIME } from "../../src/di/constants";
import { Lifetime } from "../../src/di/types/registration";
import { UndefinedScopeError } from "../../src/di/exceptions/UndefinedScopeError";
import { Singleton } from "../../src/di/decorators";

describe("dependency Injection container", () => {
    beforeEach(async () => await container.reset());
    describe("register and resolve", () => {
        test("should throw an error when token not registered", () => {
            expect(() => container.resolve("test")).toThrow(TokenNotFoundError);
        });
        test("should throw an error when token not registered async", () => {
            expect(container.resolveAsync("test")).rejects.toThrow(TokenNotFoundError);
        });
        test("should handle async dispose", async () => {
            class TestAsyncDisposable implements AsyncDisposable {
                async [Symbol.asyncDispose](): Promise<void> {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }
            container.register("asyncDisposable", TestAsyncDisposable, { lifetime: Lifetime.Singleton });
            container.resolve("asyncDisposable");
            const startTime = Date.now();
            await container.clearInstances();
            const endTime = Date.now();
            expect(endTime - startTime).toBeGreaterThanOrEqual(100);
        });
        /*test("should register registration", () => {
            container.registerRegistration("test", {
                injections: [],
                provider: { useValue: "test" },
                providerType: ProvidersType.ValueProvider,
                options: { lifetime: Lifetime.Singleton },
            });
            expect(container.hasRegistration("test")).toBe(true);
        });*/
        /*test("should register instance", () => {
            container.registerInstance("test", "test");
            expect(container.hasRegistration("test")).toBe(true);
        });*/
        /*test("should register type constructor", () => {
            class Test {}
            container.registerType("test", Test);
            expect(container.hasRegistration("test")).toBe(true);
        });*/
        test("should register type TokenProvider", () => {
            container.register("test", { useValue: "test" });
            container.registerType("test2", "test");
            expect(container.resolve("test2")).toBe("test");
        });
        test("should remove registration", async () => {
            class Test {}
            container.register("test", Test, { lifetime: Lifetime.Singleton });
            container.register("test", Test, { lifetime: Lifetime.Transient });
            const instances = container.resolveAll("test");
            expect(instances).toBeInstanceOf(Array);
            expect(instances).toHaveLength(2);
            expect(instances[0]).toBeInstanceOf(Test);
            expect(instances[1]).toBeInstanceOf(Test);
            expect(instances[0]).not.toBe(instances[1]);
            await container.removeRegistration("test", (reg) => reg.options.lifetime === Lifetime.Transient);
            const instances2 = container.resolveAll("test");
            expect(instances2).toBeInstanceOf(Array);
            expect(instances2).toHaveLength(1);
            expect(instances2[0]).toBeInstanceOf(Test);
            expect(instances2[0]).toBe(instances[0]);
            await container.removeRegistration("test", (reg) => reg.options.lifetime === Lifetime.Singleton);
            expect(() => container.resolveAll("test")).toThrow(TokenNotFoundError);
        });
        test("should resolve directly in constructor param", () => {
            @Singleton()
            class Test {}
            @Singleton()
            class Test2 {
                constructor(public readonly test: Test = container.resolve(Test)) {}
            }
            const test2 = container.resolve<Test2>(Test2);
            const test = container.resolve<Test>(Test);
            expect(test2).toBeInstanceOf(Test2);
            expect(test).toBeInstanceOf(Test);
            expect(test2.test).toBeInstanceOf(Test);
            expect(test2.test).toBe(test);
        });
        /*describe("hasRegistration", () => {
            test("should return false when token not registered", () => {
                expect(container.hasRegistration("test")).toBe(false);
            });
            test("should return true when token registered", () => {
                container.register("test", { useValue: "test" });
                expect(container.hasRegistration("test")).toBe(true);
            });
        });*/
        /*describe("getRegistration", () => {
            test("should return undefined when token not registered", () => {
                expect(container.getRegistration("test")).toBe(undefined);
            });
            test("should return registration when token registered", () => {
                container.register("test", { useValue: "test" });
                expect(container.getRegistration("test")).toBeDefined();
            });
        });*/
        /*describe("getAllRegistrations", () => {
            test("should return empty array when token not registered", () => {
                expect(container.getAllRegistrations("test")).toEqual([]);
            });
            test("should return registration when token registered", () => {
                container.register("test", { useValue: "test" });
                expect(container.getAllRegistrations("test")).toBeDefined();
            });
        });*/
        describe("clearInstances", () => {
            /*test("clears ValueProvider registrations", () => {
                class Foo {}
                const instance1 = new Foo();
                container.registerInstance("Test", instance1);

                expect(container.resolve("Test")).toBeInstanceOf(Foo);

                container.clearInstances();
                expect(container.getRegistration("Test")?.instance).toBeUndefined();
            });*/

            test("clears cached instances from container.resolve() calls", () => {
                class Foo {}
                container.register(Foo, Foo, { lifetime: Lifetime.Singleton });
                const instance1 = container.resolve(Foo);

                container.clearInstances();

                // Foo should still be registered as singleton
                const instance2 = container.resolve(Foo);
                const instance3 = container.resolve(Foo);

                expect(instance1).not.toBe(instance2);
                expect(instance2).toBe(instance3);
                expect(instance3).toBeInstanceOf(Foo);
            });
        });
        describe("resolveAll", () => {
            describe("sync", () => {
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

                    const foo1 = container.resolveAll<Foo>(Foo);
                    const foo2 = container.resolveAll<Foo>(Foo);

                    expect(Array.isArray(foo1)).toBeTruthy();
                    expect(Array.isArray(foo2)).toBeTruthy();
                    expect(foo1[0]).toBeInstanceOf(Foo);
                    expect(foo2[0]).toBeInstanceOf(Foo);
                    expect(foo1[0]).not.toBe(foo2[0]);
                });
            });
            describe("async", () => {
                test("fails to resolveAll unregistered dependency by name sync", () => {
                    expect(container.resolveAllAsync("NotRegistered")).rejects.toThrow(TokenNotFoundError);
                });
                test("resolves an array of transient instances bound to a single interface", async () => {
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

                    const fooArray = await container.resolveAllAsync<FooInterface>("FooInterface");
                    expect(Array.isArray(fooArray)).toBeTruthy();
                    expect(fooArray[0]).toBeInstanceOf(FooOne);
                    expect(fooArray[1]).toBeInstanceOf(FooTwo);
                });

                test("resolves all transient instances when not registered", async () => {
                    class Foo {}

                    const foo1 = await container.resolveAllAsync<Foo>(Foo);
                    const foo2 = await container.resolveAllAsync<Foo>(Foo);

                    expect(Array.isArray(foo1)).toBeTruthy();
                    expect(Array.isArray(foo2)).toBeTruthy();
                    expect(foo1[0]).toBeInstanceOf(Foo);
                    expect(foo2[0]).toBeInstanceOf(Foo);
                    expect(foo1[0]).not.toBe(foo2[0]);
                });
            });
        });
        describe("Child Container", () => {
            test("should create a child container", () => {
                const childContainer = container.createChildContainer();
                expect(childContainer).toBeInstanceOf(Container);
            });
            describe("sync", () => {
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

                /*test("hasRegistration check parent containers recursively", () => {
                    class A {}
                    container.registerType(A, A);
                    const childContainer = container.createChildContainer();
                    expect(container.hasRegistration(A)).toBe(true);
                    expect(childContainer.hasRegistration(A)).toBe(true);
                });*/
            });
            describe("async", () => {
                test("should resolve in child container", () => {
                    const childContainer = container.createChildContainer();
                    childContainer.register("test", { useValue: "test" });
                    expect(childContainer.resolveAsync("test")).resolves.toBe("test");
                    expect(container.resolveAsync("test")).rejects.toThrow(TokenNotFoundError);
                });
                test("should not resolve in parent container", () => {
                    const childContainer = container.createChildContainer();
                    container.register("test", { useValue: "test" });
                    expect(container.resolveAsync("test")).resolves.toBe("test");
                    expect(childContainer.resolveAsync("test")).resolves.toBe("test");
                });
                test("should resolve scoped", async () => {
                    class Test {
                        propertyA = "test";
                    }
                    container.register("test", Test, { lifetime: Lifetime.Scoped });
                    const childContainer = container.createChildContainer();
                    const scope = childContainer.createScope();
                    expect((await childContainer.resolveAsync<Test>("test", scope)).propertyA).toBe("test");
                });
                test("child container resolves even when parent doesn't have registration", () => {
                    interface IFoo {}
                    class Foo implements IFoo {}
                    const childContainer = container.createChildContainer();
                    childContainer.register("IFoo", { useClass: Foo });
                    expect(childContainer.resolveAsync<Foo>("IFoo")).resolves.toBeInstanceOf(Foo);
                });
                test("child container resolves using parent's registration when child container doesn't have registration", () => {
                    interface IFoo {}
                    class Foo implements IFoo {}
                    container.register("IFoo", { useClass: Foo });
                    const childContainer = container.createChildContainer();
                    expect(childContainer.resolveAsync<Foo>("IFoo")).resolves.toBeInstanceOf(Foo);
                });
                test("child container resolves all even when parent doesn't have registration", async () => {
                    interface IFoo {}
                    class Foo implements IFoo {}
                    const childContainer = container.createChildContainer();
                    childContainer.register("IFoo", { useClass: Foo });
                    const myFoo = await childContainer.resolveAllAsync<IFoo>("IFoo");
                    expect(myFoo).toBeInstanceOf(Array);
                    expect(myFoo).toHaveLength(1);
                    expect(myFoo[0]).toBeInstanceOf(Foo);
                });

                test("child container resolves all using parent's registration when child container doesn't have registration", async () => {
                    interface IFoo {}
                    class Foo implements IFoo {}
                    container.register("IFoo", { useClass: Foo });
                    const childContainer = container.createChildContainer();
                    const myFoo = await childContainer.resolveAllAsync<IFoo>("IFoo");
                    expect(myFoo).toBeInstanceOf(Array);
                    expect(myFoo).toHaveLength(1);
                    expect(myFoo[0]).toBeInstanceOf(Foo);
                });
            });
        });
        describe("Class Provider", () => {
            test("should register and resolve class with string token", () => {
                class TestClass {
                    public propertyA = "test";
                }
                container.register("test", { useClass: TestClass });
                const value = container.resolve<TestClass>("test");
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
            });
            test("should register and resolve class with class token", () => {
                class TestClass {
                    public propertyA = "test";
                }
                container.register(TestClass, { useClass: TestClass });
                const value = container.resolve<TestClass>(TestClass);
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
            });
            test("should register and resolve class with class token and provider", () => {
                class TestClass {
                    public propertyA = "test";
                }
                container.register(TestClass, TestClass);
                const value = container.resolve<TestClass>(TestClass);
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
            });
            test("should register and resolve singleton", () => {
                class TestClass {
                    public propertyA = "test";
                }
                container.register(TestClass, TestClass, { lifetime: Lifetime.Singleton });
                const value = container.resolve<TestClass>(TestClass);
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
                value.propertyA = "test2";
                const value2 = container.resolve<TestClass>(TestClass);
                expect(value2).toBeInstanceOf(TestClass);
                expect(value2.propertyA).toBe("test2");
            });
            test("should register and resolve transient", () => {
                class TestClass {
                    public propertyA = "test";
                }
                container.register(TestClass, TestClass, { lifetime: Lifetime.Transient });
                const value = container.resolve<TestClass>(TestClass);
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
                value.propertyA = "test2";
                const value2 = container.resolve<TestClass>(TestClass);
                expect(value2).toBeInstanceOf(TestClass);
                expect(value2.propertyA).toBe("test");
            });

            test("should throw an error when trying to instanciate a scoped object without a scope", () => {
                class TestClass {}
                container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Scoped });
                expect(() => container.resolve<TestClass>("test")).toThrow(UndefinedScopeError);
            });
        });
        describe("Factory Provider", () => {
            describe("sync", () => {
                test("should register and resolve a factory", () => {
                    class TestClass {
                        public propertyFactory;
                        constructor() {
                            this.propertyFactory = "test";
                        }
                    }
                    container.register("test", { useFactory: () => new TestClass() });
                    const value = container.resolve<TestClass>("test");
                    expect(value).toBeInstanceOf(TestClass);
                    expect(value.propertyFactory).toBe("test");
                });
                test("register and resolve a factory value", () => {
                    container.register("test", { useFactory: (cont) => cont });
                    const value = container.resolve("test");
                    expect(value).toBe(container);
                });
            });
            describe("async", () => {
                test("should register and resolve a factory", async () => {
                    class TestClass {
                        public propertyFactory;
                        constructor() {
                            this.propertyFactory = "test";
                        }
                    }
                    container.register("test", { useFactory: () => new TestClass() });
                    const value = await container.resolveAsync<TestClass>("test");
                    expect(value).toBeInstanceOf(TestClass);
                    expect(value.propertyFactory).toBe("test");
                });
                test("should handle async factory providers", async () => {
                    const asyncFactory = async () => {
                        return new Promise((resolve) => {
                            setTimeout(() => resolve({ key: "asyncValue" }), 100);
                        });
                    };
                    container.register("asyncToken", { useFactory: asyncFactory });
                    const resolved = await container.resolveAsync("asyncToken");
                    expect(resolved).toEqual({ key: "asyncValue" });
                });
                test("register and resolve a factory value", async () => {
                    container.register("test", { useFactory: (cont) => cont });
                    const value = await container.resolveAsync("test");
                    expect(value).toBe(container);
                });
            });
        });
        describe("Value Provider", () => {
            test("should register and resolve value", () => {
                const testValue = "test";
                container.register("test", { useValue: testValue });
                const value = container.resolve("test");
                expect(value).toBe(testValue);
            });
            test("should register and resolve value async", async () => {
                const testValue = "test";
                container.register("test", { useValue: testValue });
                const value = await container.resolveAsync("test");
                expect(value).toBe(testValue);
            });
        });
        describe("constructor token provider", () => {
            class TestClass {
                propertyA = "test";
                public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
            }
            const value = container.resolve<TestClass>(TestClass);
            expect(value).toBeInstanceOf(TestClass);
            expect(value.propertyA).toBe("test");
            value.propertyA = "test2";
        });
    });
});
