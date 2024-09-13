import { describe, test, expect, beforeEach } from "@jest/globals";
import { container } from "../../src/di/container";
import { TokenNotFoundError } from "../../src/di/exceptions/TokenNotFoundError";
import {  STATIC_INJECT_LIFETIME } from "../../src/di/constants";
import { Lifetime } from "../../src/di/types/Registration";
import { UndefinedScopeError } from "../../src/di/exceptions/UndefinedScopeError";

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
    });
    
});
