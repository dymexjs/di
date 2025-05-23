/* eslint-disable sonarjs/no-nested-functions */
import * as assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  container,
  Lifetime,
  Scoped,
  Singleton,
  STATIC_INJECTION_LIFETIME,
  STATIC_INJECTIONS,
  StaticInjectable,
  Token,
  UndefinedScopeError,
} from "../src/index.ts";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => await container.dispose());
  describe("README", () => {
    describe("Basic Usage", () => {
      test("Decorators", () => {
        class TestService {
          printMessage() {
            return "I'm printting this message inside of TestService instance.";
          }
        }

        @Singleton([TestService])
        class Test {
          public testService: TestService;

          constructor(testService: TestService) {
            this.testService = testService;
          }
        }

        const testInstance = container.resolve(Test);
        assert.strictEqual(
          testInstance.testService.printMessage(),
          "I'm printting this message inside of TestService instance.",
        );
      });
      describe("Static inject", () => {
        test("Example 1", () => {
          class TestClass implements StaticInjectable<typeof TestClass> {
            public static readonly [STATIC_INJECTION_LIFETIME] =
              Lifetime.Singleton;

            public propertyA = "test";
          }
          class TestClass2 implements StaticInjectable<typeof TestClass2> {
            public static readonly [STATIC_INJECTIONS] = ["test"];

            public test: TestClass;

            constructor(test: TestClass) {
              this.test = test;
            }
          }
          container.register("test", { useClass: TestClass });
          const test2 = container.resolve(TestClass2);
          assert.strictEqual(test2.test.propertyA, "test");
        });
        test("Example 2", () => {
          class TestClass implements StaticInjectable<typeof TestClass> {
            public static readonly [STATIC_INJECTION_LIFETIME] =
              Lifetime.Singleton;

            public propertyA = "test";
          }
          class TestClass2 implements StaticInjectable<typeof TestClass2> {
            public static readonly [STATIC_INJECTIONS] = [TestClass];

            public test: TestClass;

            constructor(test: TestClass) {
              this.test = test;
            }
          }
          const test2 = container.resolve(TestClass2);
          assert.strictEqual(test2.test.propertyA, "test");
        });
      });
    });
    describe("Decorators", () => {
      test("empty singleton", () => {
        @Singleton()
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class TestClass {}
        const instance1 = container.resolve(TestClass);
        assert.ok(instance1 instanceof TestClass);
      });
      test("with registration token", () => {
        @Singleton("serviceA") //With token to register
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Singleton(["serviceA"]) //With an array of dependencies to resolve when creating the instance
        class ServiceB {
          public serviceA: ServiceA;

          constructor(serviceA: ServiceA) {
            this.serviceA = serviceA;
          }
        }
        const b = container.resolve<ServiceB>(ServiceB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
      });
      test("empty token with dependencies", () => {
        @Singleton()
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Singleton([ServiceA]) //With an array of dependencies to resolve when creating the instance
        class ServiceB {
          public serviceA: ServiceA;

          constructor(serviceA: ServiceA) {
            this.serviceA = serviceA;
          }
        }
        const b = container.resolve<ServiceB>(ServiceB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
      });
      test("empty scoped without scope", () => {
        @Scoped()
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class TestClass {}
        assert.throws(() => container.resolve(TestClass), UndefinedScopeError);
      });
      test("empty scoped with scope", () => {
        @Scoped()
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class TestClass {}
        const scope = container.createScope();
        const instance1 = scope.resolve(TestClass);
        assert.ok(instance1 instanceof TestClass);
      });
    });
    describe("API", () => {
      describe("Container", () => {
        test("test token", () => {
          const JWT_SECRET = new Token("jwt_secret");
          container.registerValue(JWT_SECRET, "my secure secret");
          const secret = container.resolve(JWT_SECRET);
          assert.strictEqual(secret, "my secure secret");
        });
      });
    });
  });
});
