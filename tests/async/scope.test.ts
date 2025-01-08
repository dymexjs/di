import { beforeEach, describe, test } from "node:test";
import { container } from "../../src/container";
import { Lifetime } from "../../src/types/registration.interface";
import { STATIC_INJECTION_LIFETIME } from "../../src/constants";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError";
import { ScopeContext } from "../../src/scope-context";
import { Scoped } from "../../src/decorators";
import * as assert from "node:assert/strict";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("scope", () => {
      test("dispose scope", async () => {
        const scope = container.createScope();
        assert.strictEqual(container.scopes.size, 1);
        assert.ok(scope instanceof ScopeContext);
        await container.disposeScope(scope);
        assert.strictEqual(container.scopes.size, 0);
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
          const value = await container.resolveAsync(TestClass, scope);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = await container.resolveAsync(TestClass, scope);
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
          const value = await container.resolveAsync(TestClass, scope);
          assert.ok(value instanceof TestClass);
          assert.strictEqual(value.propertyA, "test");
          value.propertyA = "test2";
          const scope2 = container.createScope();
          const value2 = await container.resolveAsync(TestClass, scope2);
          assert.ok(value2 instanceof TestClass);
          assert.strictEqual(value2.propertyA, "test");
        });
      });
      describe("other", () => {
        test("register constructor in scope", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          const scope = container.createScope();
          const test = await container.resolveAsync(Test, scope);
          assert.ok(test instanceof Test);
        });
        test("throw register constructor without scope", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          assert.rejects(container.resolveAsync(Test), UndefinedScopeError);
        });
        test("register constructor in scope with decorator", async () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          const scope = container.createScope();
          const test = await container.resolveAsync(Test, scope);
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
