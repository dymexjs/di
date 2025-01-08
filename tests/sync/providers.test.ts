import { beforeEach, describe, test } from "node:test";
import { container } from "../../src/container";
import { Lifetime } from "../../src/types/registration.interface";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError";
import { STATIC_INJECTION_LIFETIME } from "../../src/constants";
import * as assert from "node:assert/strict";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => container.reset());
  describe("sync", () => {
    describe("Provider", () => {
      describe("ValueProvider", () => {
        test("should allow array to be registered", () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          const value = [new Test()];
          container.register("array", { useValue: value });
          const result = container.resolve<Array<Test>>("array");
          assert.ok(result instanceof Array);
          assert.strictEqual(result.length, 1);
          assert.ok(result[0] instanceof Test);
          assert.strictEqual(result, value);
        });
        test("should register and resolve value", () => {
          const testValue = "test";
          container.register("test", { useValue: testValue });
          const value = container.resolve("test");
          assert.strictEqual(value, testValue);
        });
      });
      describe("Factory provider", () => {
        test("should allow to register an array", () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          container.register<Test>(Test, { useClass: Test });
          container.register<Array<Test>>("array", {
            useFactory: (cont): Array<Test> => [cont.resolve(Test)],
          });
          const result = container.resolve<Array<Test>>("array");
          assert.ok(result instanceof Array);
          assert.strictEqual(result.length, 1);
          assert.ok(result[0] instanceof Test);
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
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyFactory, "test");
        });
        test("register and resolve a factory value", () => {
          container.register("test", { useFactory: (cont) => cont });
          const value = container.resolve("test");
          assert.strictEqual(value, container);
        });
        test("executes a registered factory each time resolve is called", (t) => {
          const factoryMock = t.mock.fn();
          container.register("Test", { useFactory: factoryMock });

          container.resolve("Test");
          container.resolve("Test");

          assert.strictEqual(factoryMock.mock.callCount(), 2);
        });

        test("resolves to factory result each time resolve is called", (t) => {
          const factoryMock = t.mock.fn();
          container.register("Test", { useFactory: factoryMock });
          const value1 = 1;
          const value2 = 2;

          factoryMock.mock.mockImplementation(() => value1 as never);
          const result1 = container.resolve("Test");
          factoryMock.mock.mockImplementation(() => value2 as never);
          const result2 = container.resolve("Test");

          assert.strictEqual(result1, value1);
          assert.strictEqual(result2, value2);
        });
      });
      describe("Class Provider", () => {
        test("should register and resolve class with string token", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register("test", { useClass: TestClass });
          const value = container.resolve<TestClass>("test");
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
        });
        test("should register and resolve class with class token", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, { useClass: TestClass });
          const value = container.resolve(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
        });
        test("should register and resolve class with class token and provider", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass);
          const value = container.resolve(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
        });
        test("should register and resolve singleton", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Singleton,
          });
          const value = container.resolve(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = container.resolve<TestClass>(TestClass);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test2");
        });
        test("should register and resolve transient", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Transient,
          });
          const value = container.resolve(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = container.resolve<TestClass>(TestClass);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test");
        });

        test("should throw an error when trying to instanciate a scoped object without a scope", () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestClass {}
          container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Scoped });
          assert.throws(() => container.resolve<TestClass>("test"), UndefinedScopeError);
        });
      });
      describe("Token Provider", () => {
        test("should register type TokenProvider", () => {
          container.register("test", { useValue: "test" });
          container.registerType("test2", "test");
          assert.strictEqual(container.resolve("test2"), "test");
        });
      });
      describe("Constructor Provider", () => {
        test("constructor token provider", () => {
          class TestClass {
            propertyA = "test";
            public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
          }
          const value = container.resolve(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
        });
        test("should return a transient when constructor not registered", () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          const test1 = container.resolve(Test);
          const test2 = container.resolve(Test);
          assert.ok(test1 instanceof Test);
          assert.ok(test2 instanceof Test);
          assert.deepStrictEqual(test1, test2);
          assert.notStrictEqual(test1, test2);
        });
      });
    });
  });
});
