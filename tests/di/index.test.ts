import { describe, test, expect, beforeEach } from "@jest/globals";
import { container } from "../../src/di/container";
import { Lifetime, ScopeContext, STATIC_INJECT_KEY, STATIC_INJECT_LIFETIME } from "../../src/di/types";
import { TokenNotFoundError } from "../../src/di/exceptions/TokenNotFoundError";

describe("dependency Injection container", () => {
    beforeEach(() => {
        container.reset();
    });
    describe("register and resolve", () => {
        test("should throw an error when token not registered", () => {
            expect(() => container.resolve("test")).toThrow(TokenNotFoundError);
        });
        describe("hasRegistration", () => {
            test("should return false when token not registered", () => {
                expect(container.hasRegistration("test")).toBe(false);
            });
            test("should return true when token registered", () => {
                container.register("test", { useValue: "test" });
                expect(container.hasRegistration("test")).toBe(true);
            });
        });
        describe("getRegistration", () => {
            test("should throw an error when token not registered", () => {
                expect(container.getRegistration("test")).toBe(undefined);
            });
            test("should return registration when token registered", () => {
                container.register("test", { useValue: "test" });
                expect(container.getRegistration("test")).toBeDefined();
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
                    constructor() {}
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
                    constructor() {}
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
            test("should register and resolve scoped correctly", () => {
                class TestClass {
                    public propertyA = "test";
                    constructor() {}
                }
                const scope = container.createScope();
                container.register(TestClass, TestClass, { lifetime: Lifetime.Scoped });
                const value = container.resolve<TestClass>(TestClass, scope);
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
                value.propertyA = "test2";
                const value2 = container.resolve<TestClass>(TestClass, scope);
                expect(value2).toBeInstanceOf(TestClass);
                expect(value2.propertyA).toBe("test2");
            });
            test("should register and resolve scoped wrongly because scope is diferent", () => {
                class TestClass {
                    public propertyA = "test";
                    constructor() {}
                }
                const scope = container.createScope();
                container.register(TestClass, TestClass, { lifetime: Lifetime.Scoped });
                const value = container.resolve<TestClass>(TestClass, scope);
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
                value.propertyA = "test2";
                const scope2 = container.createScope();
                const value2 = container.resolve<TestClass>(TestClass, scope2);
                expect(value2).toBeInstanceOf(TestClass);
                expect(value2.propertyA).toBe("test");
            });
        });
        describe("Factory Provider", () => {
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
        describe("Value Provider", () => {
            test("should register and resolve value", () => {
                const testValue = "test";
                container.register("test", { useValue: testValue });
                const value = container.resolve("test");
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
        describe("Static Injector", () => {
            test("should register and resolve with static injector", () => {
                class TestClass {
                    public propertyA = "test";
                }
                class TestClass2 {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["test"];
                }
                container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Singleton });
                const test2 = container.staticInject(TestClass2);
                const test = container.resolve<TestClass>("test");
                expect(test2).toBeInstanceOf(TestClass2);
                expect(test2.test).toBeInstanceOf(TestClass);
                expect(test2.test.propertyA).toBe("test");
                expect(test2.test).toBe(test);
                test.propertyA = "test2";
                const test3 = container.resolve<TestClass>("test");
                expect(test3).toBeInstanceOf(TestClass);
                expect(test3.propertyA).toBe("test2");
                expect(test2.test).toBe(test3);
            });
            test("should register singleton from STATIC_INJECT_LIFETIME", () => {
                class TestClass {
                    public propertyA = "test";
                    public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
                }
                class TestClass2 {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["test"];
                }
                container.register("test", { useClass: TestClass });
                const test2 = container.staticInject(TestClass2);
                const test = container.resolve<TestClass>("test");
                expect(test2).toBeInstanceOf(TestClass2);
                expect(test2.test).toBeInstanceOf(TestClass);
                expect(test2.test.propertyA).toBe("test");
                expect(test2.test).toBe(test);
                test.propertyA = "test2";
                const test3 = container.resolve<TestClass>("test");
                expect(test3).toBeInstanceOf(TestClass);
                expect(test3.propertyA).toBe("test2");
                expect(test2.test).toBe(test3);
            });
        });
    });
    describe("scope", () => {
        test("create scope", () => {
            expect(container.createScope()).toBeInstanceOf(ScopeContext);
            expect(container.scopes.size).toBe(1);
        });
        test("dispose scope", () => {
            const scope = container.createScope();
            expect(container.scopes.size).toBe(1);
            expect(scope).toBeInstanceOf(ScopeContext);
            container.disposeScope(scope);
            expect(container.scopes.size).toBe(0);
        });
    });
});
