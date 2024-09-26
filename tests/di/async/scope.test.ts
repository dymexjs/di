import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../../src/di/container";
import { Lifetime } from "../../../src/di/types/registration.interface";
import { STATIC_INJECTION_LIFETIME } from "../../../src/di/constants";
import { UndefinedScopeError } from "../../../src/di/exceptions/UndefinedScopeError";
import { ScopeContext } from "../../../src/di/scope-context";
import { Scoped } from "../../../src/di/decorators";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("scope", () => {
      test("dispose scope", async () => {
        const scope = container.createScope();
        expect(container.scopes.size).toBe(1);
        expect(scope).toBeInstanceOf(ScopeContext);
        await container.disposeScope(scope);
        expect(container.scopes.size).toBe(0);
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
          expect(value).toBeInstanceOf(TestClass);
          expect(value.propertyA).toBe("test");
          value.propertyA = "test2";
          const value2 = await container.resolveAsync(TestClass, scope);
          expect(value2).toBeInstanceOf(TestClass);
          expect(value2.propertyA).toBe("test2");
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
          expect(value).toBeInstanceOf(TestClass);
          expect(value.propertyA).toBe("test");
          value.propertyA = "test2";
          const scope2 = container.createScope();
          const value2 = await container.resolveAsync(TestClass, scope2);
          expect(value2).toBeInstanceOf(TestClass);
          expect(value2.propertyA).toBe("test");
        });
      });
      describe("other", () => {
        test("register constructor in scope", async () => {
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          const scope = container.createScope();
          const test = await container.resolveAsync(Test, scope);
          expect(test).toBeInstanceOf(Test);
        });
        test("throw register constructor without scope", async () => {
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          expect(container.resolveAsync(Test)).rejects.toThrow(
            UndefinedScopeError,
          );
        });
        test("register constructor in scope with decorator", async () => {
          @Scoped()
          class Test {}
          const scope = container.createScope();
          const test = await container.resolveAsync(Test, scope);
          expect(test).toBeInstanceOf(Test);
        });
        test("throw register constructor without scope with decorator", () => {
          @Scoped()
          class Test {}
          expect(container.resolveAsync(Test)).rejects.toThrow(
            UndefinedScopeError,
          );
        });
      });
    });
  });
});
