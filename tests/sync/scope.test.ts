import { beforeEach, describe, test } from "node:test";
import * as assert from "node:assert/strict";
import {
  container,
  Lifetime,
  ScopeContext,
  Scoped,
  STATIC_INJECTION_LIFETIME,
  UndefinedScopeError,
} from "../../src/index.ts";
import { DisposedScopeError } from "../../src/exceptions/DisposedScopeError.ts";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.dispose());
  describe("sync", () => {
    describe("scope", () => {
      test("create scope", async () => {
        const scope = container.createScope();
        assert.ok(scope instanceof ScopeContext);
        await scope.dispose();
        assert.throws(() => scope.resolve("anyKey"), DisposedScopeError);
      });
      describe("Class provider", () => {
        test("should register and resolve scoped correctly", () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = scope.resolve(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = scope.resolve(TestClass);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test2");
        });
        test("should register and resolve scoped diferent instances because scope is diferent", () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = scope.resolve(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const scope2 = container.createScope();
          const value2 = scope2.resolve(TestClass);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test");
        });
      });
      describe("other", () => {
        test("register constructor in scope", () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          const scope = container.createScope();
          const test = scope.resolve(Test);
          assert.ok(test instanceof Test);
        });
        test("throw register constructor without scope", () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          assert.throws(() => container.resolve(Test), UndefinedScopeError);
        });
        test("register constructor in scope with decorator", () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          const scope = container.createScope();
          const test = scope.resolve(Test);
          assert.ok(test instanceof Test);
        });
        test("throw register constructor without scope with decorator", () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          assert.throws(() => container.resolve(Test), UndefinedScopeError);
        });
      });
    });
  });
});
