import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../src/container";
import { Lifetime } from "../../src/types/registration.interface";
import { STATIC_INJECTION_LIFETIME } from "../../src/constants";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError";
import { ScopeContext } from "../../src/scope-context";
import { Scoped } from "../../src/decorators";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("sync", () => {
    describe("scope", () => {
      test("create scope", () => {
        expect(container.createScope()).toBeInstanceOf(ScopeContext);
        expect(container.scopes.size).toBe(1);
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
          const value = container.resolve(TestClass, scope);
          expect(value).toBeInstanceOf(TestClass);
          expect(value.propertyA).toBe("test");
          value.propertyA = "test2";
          const value2 = container.resolve(TestClass, scope);
          expect(value2).toBeInstanceOf(TestClass);
          expect(value2.propertyA).toBe("test2");
        });
        test("should register and resolve scoped diferent instances because scope is diferent", () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = container.resolve(TestClass, scope);
          expect(value).toBeInstanceOf(TestClass);
          expect(value.propertyA).toBe("test");
          value.propertyA = "test2";
          const scope2 = container.createScope();
          const value2 = container.resolve(TestClass, scope2);
          expect(value2).toBeInstanceOf(TestClass);
          expect(value2.propertyA).toBe("test");
        });
      });
      describe("other", () => {
        test("register constructor in scope", () => {
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          const scope = container.createScope();
          const test = container.resolve(Test, scope);
          expect(test).toBeInstanceOf(Test);
        });
        test("throw register constructor without scope", () => {
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          expect(() => container.resolve(Test)).toThrow(UndefinedScopeError);
        });
        test("register constructor in scope with decorator", () => {
          @Scoped()
          class Test {}
          const scope = container.createScope();
          const test = container.resolve(Test, scope);
          expect(test).toBeInstanceOf(Test);
        });
        test("throw register constructor without scope with decorator", () => {
          @Scoped()
          class Test {}
          expect(() => container.resolve(Test)).toThrow(UndefinedScopeError);
        });
      });
    });
  });
});
