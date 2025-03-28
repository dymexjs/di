/* eslint-disable sonarjs/no-nested-functions */
import * as assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  container,
  getInterfaceToken,
  Lifetime,
  STATIC_INJECTION_LIFETIME,
  UndefinedScopeError,
} from "../../src/index.ts";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => container.dispose());
  describe("async", () => {
    describe("Provider", () => {
      describe("ValueProvider", () => {
        test("should allow array to be registered", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          const value = [new Test()];
          container.register("array", { useValue: value });
          const result = await container.resolveAsync<Array<Test>>("array");
          assert.ok(Array.isArray(result));
          assert.strictEqual(result.length, 1);
          assert.ok(result[0] instanceof Test);
          assert.strictEqual(result, value);
        });
        test("should register and resolve value async", async () => {
          const testValue = "test";
          container.register("test", { useValue: testValue });
          const value = await container.resolveAsync("test");
          assert.strictEqual(value, testValue);
        });
      });
      describe("Factory provider", () => {
        test("should allow to register an array", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          container.register(Test, { useClass: Test });
          container.registerFactory(
            "array",
            async (cont): Promise<Array<Test>> => [await cont.resolve(Test)],
            [getInterfaceToken("IContainer")],
          );
          const result = await container.resolveAsync<Array<Test>>("array");
          assert.ok(Array.isArray(result));
          assert.strictEqual(result.length, 1);
          assert.ok(result[0] instanceof Test);
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
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyFactory, "test");
        });
        test("should handle async factory providers", async () => {
          // eslint-disable-next-line unicorn/consistent-function-scoping
          async function asyncFactory() {
            return new Promise((resolve) => {
              setTimeout(() => resolve({ key: "asyncValue" }), 100);
            });
          }
          container.register("asyncToken", { useFactory: asyncFactory });
          const resolved = await container.resolveAsync("asyncToken");
          assert.deepStrictEqual(resolved, { key: "asyncValue" });
        });
        test("register and resolve a factory value", async () => {
          container.registerFactory("test", (cont) => cont, [
            getInterfaceToken("IContainer"),
          ]);
          const value = await container.resolveAsync("test");
          assert.strictEqual(value, container);
        });

        test("executes a registered factory each time resolve is called", async (t) => {
          const factoryMock = t.mock.fn();
          container.register("Test", { useFactory: factoryMock });

          await container.resolveAsync("Test");
          await container.resolveAsync("Test");

          assert.strictEqual(factoryMock.mock.callCount(), 2);
        });

        test("resolves to factory result each time resolve is called", async (t) => {
          const factoryMock = t.mock.fn();
          container.register("Test", { useFactory: factoryMock });
          const value1 = 1;
          const value2 = 2;

          factoryMock.mock.mockImplementationOnce(() => value1 as never);
          const result1 = await container.resolveAsync("Test");
          factoryMock.mock.mockImplementationOnce(() => value2 as never);
          const result2 = await container.resolveAsync("Test");

          assert.strictEqual(result1, value1);
          assert.strictEqual(result2, value2);
        });
      });
      describe("Class Provider", () => {
        test("should register and resolve class with string token", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register("test", { useClass: TestClass });
          const value = await container.resolveAsync<TestClass>("test");
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
        });
        test("should register and resolve class with class token", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, { useClass: TestClass });
          const value = await container.resolveAsync(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
        });
        test("should register and resolve class with class token and provider", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass);
          const value = await container.resolveAsync(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
        });
        test("should register and resolve singleton", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Singleton,
          });
          const value = await container.resolveAsync(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = await container.resolveAsync(TestClass);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test2");
        });
        test("should register and resolve transient", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Transient,
          });
          const value = await container.resolveAsync(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = await container.resolveAsync(TestClass);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test");
        });

        test("should throw an error when trying to instanciate a scoped object without a scope", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestClass {}
          container.register(
            "test",
            { useClass: TestClass },
            { lifetime: Lifetime.Scoped },
          );
          assert.rejects(
            container.resolveAsync<TestClass>("test"),
            UndefinedScopeError,
          );
        });
      });
      describe("Token Provider", () => {
        test("should register type TokenProvider", async () => {
          container.register("test", { useValue: "test" });
          container.registerType("test2", "test");
          assert.strictEqual(await container.resolveAsync("test2"), "test");
        });
      });
      describe("Constructor Provider", () => {
        test("constructor token provider", async () => {
          class TestClass {
            public static readonly [STATIC_INJECTION_LIFETIME] =
              Lifetime.Singleton;

            propertyA = "test";
          }
          const value = await container.resolveAsync(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
        });
        test("should return a transient when constructor not registered", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          const test1 = await container.resolveAsync(Test);
          const test2 = await container.resolveAsync(Test);
          assert.ok(test1 instanceof Test);
          assert.ok(test2 instanceof Test);
          assert.deepStrictEqual(test1, test2);
          assert.notStrictEqual(test1, test2);
        });
      });
    });
  });
});
