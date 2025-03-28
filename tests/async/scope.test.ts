/* eslint-disable sonarjs/no-nested-functions */
import * as assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  container,
  DisposedScopeError,
  Lifetime,
  ScopeContext,
  Scoped,
  STATIC_INJECTION_LIFETIME,
  UndefinedScopeError,
} from "../../src/index.ts";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.dispose());
  describe("async", () => {
    describe("scope", () => {
      test("dispose scope", async () => {
        const scope = container.createScope();
        assert.ok(scope instanceof ScopeContext);
        await scope.dispose();
        assert.throws(() => scope.resolve("anyKey"), DisposedScopeError);
      });
      describe("Class provider", () => {
        test("should register and resolveAsync scoped correctly", async () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = await scope.resolveAsync(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = await scope.resolveAsync(TestClass);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test2");
        });
        test("should register and resolveAsync scoped diferent instances because scope is diferent", async () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = await scope.resolveAsync(TestClass);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const scope2 = container.createScope();
          const value2 = await scope2.resolveAsync(TestClass);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test");
        });
      });
      describe("other", () => {
        test("register constructor in scope", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {
            public static readonly [STATIC_INJECTION_LIFETIME] =
              Lifetime.Scoped;
          }
          const scope = container.createScope();
          const test = await scope.resolveAsync(Test);
          assert.ok(test instanceof Test);
        });
        test("throw register constructor without scope", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {
            public static readonly [STATIC_INJECTION_LIFETIME] =
              Lifetime.Scoped;
          }
          assert.rejects(container.resolveAsync(Test), UndefinedScopeError);
        });
        test("register constructor in scope with decorator", async () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          const scope = container.createScope();
          const test = await scope.resolveAsync(Test);
          assert.ok(test instanceof Test);
        });
        test("throw register constructor without scope with decorator", () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          assert.rejects(container.resolveAsync(Test), UndefinedScopeError);
        });
      });
    });
  });
});
