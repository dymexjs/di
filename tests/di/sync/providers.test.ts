import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { container } from "../../../src/di/container";
import { Lifetime } from "../../../src/di/types/registration.interface";
import { UndefinedScopeError } from "../../../src/di/exceptions/UndefinedScopeError";
import { STATIC_INJECTION_LIFETIME } from "../../../src/di/constants";

describe("Averix_DI ", () => {
  beforeEach(async () => container.reset());
  describe("sync", () => {
    describe("Provider", () => {
      describe("ValueProvider", () => {
        test("should allow array to be registered", () => {
          class Test {}
          const value = [new Test()];
          container.register("array", { useValue: value });
          const result = container.resolve<Test[]>("array");
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(1);
          expect(result[0]).toBeInstanceOf(Test);
          expect(result).toBe(value);
        });
        test("should register and resolve value", () => {
          const testValue = "test";
          container.register("test", { useValue: testValue });
          const value = container.resolve("test");
          expect(value).toBe(testValue);
        });
      });
      describe("Factory provider", () => {
        test("should allow to register an array", () => {
          class Test {}
          container.register<Test>(Test, { useClass: Test });
          container.register<Array<Test>>("array", {
            useFactory: (cont): Array<Test> => [cont.resolve(Test)],
          });
          const result = container.resolve<Array<Test>>("array");
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(1);
          expect(result[0]).toBeInstanceOf(Test);
        });
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
        test("executes a registered factory each time resolve is called", () => {
          const factoryMock = jest.fn();
          container.register("Test", { useFactory: factoryMock });

          container.resolve("Test");
          container.resolve("Test");

          expect(factoryMock.mock.calls.length).toBe(2);
        });

        test("resolves to factory result each time resolve is called", () => {
          const factoryMock = jest.fn();
          container.register("Test", { useFactory: factoryMock });
          const value1 = 1;
          const value2 = 2;

          factoryMock.mockReturnValue(value1);
          const result1 = container.resolve("Test");
          factoryMock.mockReturnValue(value2);
          const result2 = container.resolve("Test");

          expect(result1).toBe(value1);
          expect(result2).toBe(value2);
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
          const value = container.resolve(TestClass);
          expect(value).toBeInstanceOf(TestClass);
          expect(value.propertyA).toBe("test");
        });
        test("should register and resolve class with class token and provider", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass);
          const value = container.resolve(TestClass);
          expect(value).toBeInstanceOf(TestClass);
          expect(value.propertyA).toBe("test");
        });
        test("should register and resolve singleton", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, { lifetime: Lifetime.Singleton });
          const value = container.resolve(TestClass);
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
          const value = container.resolve(TestClass);
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
      describe("Token Provider", () => {
        test("should register type TokenProvider", () => {
          container.register("test", { useValue: "test" });
          container.registerType("test2", "test");
          expect(container.resolve("test2")).toBe("test");
        });
      });
      describe("Constructor Provider", () => {
        test("constructor token provider", () => {
          class TestClass {
            propertyA = "test";
            public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
          }
          const value = container.resolve(TestClass);
          expect(value).toBeInstanceOf(TestClass);
          expect(value.propertyA).toBe("test");
          value.propertyA = "test2";
        });
        test("should return a transient when constructor not registered", () => {
          class Test {}
          const test1 = container.resolve(Test);
          const test2 = container.resolve(Test);
          expect(test1).toBeInstanceOf(Test);
          expect(test2).toBeInstanceOf(Test);
          expect(test1).toEqual(test2);
          expect(test1).not.toBe(test2);
        });
      });
    });
  });
});
