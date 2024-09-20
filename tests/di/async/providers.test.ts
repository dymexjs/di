import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { container } from "../../../src/di/container";
import { UndefinedScopeError } from "../../../src/di/exceptions/UndefinedScopeError";
import { Lifetime } from "../../../src/di/types/registration";
import { STATIC_INJECT_LIFETIME } from "../../../src/di/constants";

describe("Averix_DI ", () => {
    beforeEach(async () => container.reset());
    describe("async", () => {
        describe("Provider", () => {
            describe("ValueProvider", () => {
                test("should allow array to be registered", async () => {
                    class Test {}
                    const value = [new Test()];
                    container.register("array", { useValue: value });
                    const result = await container.resolveAsync<Test[]>("array");
                    expect(result).toBeInstanceOf(Array);
                    expect(result).toHaveLength(1);
                    expect(result[0]).toBeInstanceOf(Test);
                    expect(result).toBe(value);
                });
                test("should register and resolve value async", async () => {
                    const testValue = "test";
                    container.register("test", { useValue: testValue });
                    const value = await container.resolveAsync("test");
                    expect(value).toBe(testValue);
                });
            });
            describe("Factory provider", () => {
                test("should allow to register an array", async () => {
                    class Test {}
                    container.register(Test, { useClass: Test });
                    container.register("array", {
                        useFactory: async (cont): Promise<Array<Test>> => Promise.resolve([await cont.resolve(Test)]),
                    });
                    const result = await container.resolveAsync<Array<Test>>("array");
                    expect(result).toBeInstanceOf(Array);
                    expect(result).toHaveLength(1);
                    expect(result[0]).toBeInstanceOf(Test);
                });
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

                test("executes a registered factory each time resolve is called", async () => {
                    const factoryMock = jest.fn();
                    container.register("Test", { useFactory: factoryMock });

                    await container.resolveAsync("Test");
                    await container.resolveAsync("Test");

                    expect(factoryMock.mock.calls.length).toBe(2);
                });

                test("resolves to factory result each time resolve is called", async () => {
                    const factoryMock = jest.fn();
                    container.register("Test", { useFactory: factoryMock });
                    const value1 = 1;
                    const value2 = 2;

                    factoryMock.mockReturnValue(value1);
                    const result1 = await container.resolveAsync("Test");
                    factoryMock.mockReturnValue(value2);
                    const result2 = await container.resolveAsync("Test");

                    expect(result1).toBe(value1);
                    expect(result2).toBe(value2);
                });
            });
            describe("Class Provider", () => {
                test("should register and resolve class with string token", async () => {
                    class TestClass {
                        public propertyA = "test";
                    }
                    container.register("test", { useClass: TestClass });
                    const value = await container.resolveAsync<TestClass>("test");
                    expect(value).toBeInstanceOf(TestClass);
                    expect(value.propertyA).toBe("test");
                });
                test("should register and resolve class with class token", async () => {
                    class TestClass {
                        public propertyA = "test";
                    }
                    container.register(TestClass, { useClass: TestClass });
                    const value = await container.resolveAsync<TestClass>(TestClass);
                    expect(value).toBeInstanceOf(TestClass);
                    expect(value.propertyA).toBe("test");
                });
                test("should register and resolve class with class token and provider", async () => {
                    class TestClass {
                        public propertyA = "test";
                    }
                    container.register(TestClass, TestClass);
                    const value = await container.resolveAsync<TestClass>(TestClass);
                    expect(value).toBeInstanceOf(TestClass);
                    expect(value.propertyA).toBe("test");
                });
                test("should register and resolve singleton", async () => {
                    class TestClass {
                        public propertyA = "test";
                    }
                    container.register(TestClass, TestClass, { lifetime: Lifetime.Singleton });
                    const value = await container.resolveAsync<TestClass>(TestClass);
                    expect(value).toBeInstanceOf(TestClass);
                    expect(value.propertyA).toBe("test");
                    value.propertyA = "test2";
                    const value2 = await container.resolveAsync<TestClass>(TestClass);
                    expect(value2).toBeInstanceOf(TestClass);
                    expect(value2.propertyA).toBe("test2");
                });
                test("should register and resolve transient", async () => {
                    class TestClass {
                        public propertyA = "test";
                    }
                    container.register(TestClass, TestClass, { lifetime: Lifetime.Transient });
                    const value = await container.resolveAsync<TestClass>(TestClass);
                    expect(value).toBeInstanceOf(TestClass);
                    expect(value.propertyA).toBe("test");
                    value.propertyA = "test2";
                    const value2 = await container.resolveAsync<TestClass>(TestClass);
                    expect(value2).toBeInstanceOf(TestClass);
                    expect(value2.propertyA).toBe("test");
                });

                test("should throw an error when trying to instanciate a scoped object without a scope", async () => {
                    class TestClass {}
                    container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Scoped });
                    expect(container.resolveAsync<TestClass>("test")).rejects.toThrow(UndefinedScopeError);
                });
            });
            describe("Token Provider", () => {
                test("should register type TokenProvider", async () => {
                    container.register("test", { useValue: "test" });
                    container.registerType("test2", "test");
                    expect(container.resolveAsync("test2")).resolves.toBe("test");
                });
            });
            describe("Constructor Provider",()=>{
                test("constructor token provider", async () => {
                    class TestClass {
                        propertyA = "test";
                        public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
                    }
                    const value = await container.resolveAsync<TestClass>(TestClass);
                    expect(value).toBeInstanceOf(TestClass);
                    expect(value.propertyA).toBe("test");
                    value.propertyA = "test2";
                });
                test("should return a transient when constructor not registered", async () => {
                    class Test {}
                    const test1 = await container.resolveAsync(Test);
                    const test2 = await container.resolveAsync(Test);
                    expect(test1).toBeInstanceOf(Test);
                    expect(test2).toBeInstanceOf(Test);
                    expect(test1).toEqual(test2);
                    expect(test1).not.toBe(test2);
                });
            });
        });
    });
});
