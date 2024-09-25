import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../src/di/container";
import { Scoped, Singleton } from "../../src/di/decorators";
import { StaticInjectable } from "../../src/di/types/static-inject.interface";
import { STATIC_INJECTION_LIFETIME, STATIC_INJECTIONS } from "../../src/di/constants";
import { Lifetime } from "../../src/di/types/registration.interface";
import { UndefinedScopeError } from "../../src/di/exceptions/UndefinedScopeError";
import { Token } from "../../src/di/types/injection-token.type";

describe("Averix_DI ", () => {
  beforeEach(async () => await container.reset());
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
          constructor(public testService: TestService) {}
        }

        const testInstance = container.resolve(Test);
        expect(testInstance.testService.printMessage()).toBe(
          "I'm printting this message inside of TestService instance.",
        );
      });
      describe("Static inject", () => {
        test("Example 1", () => {
          class TestClass implements StaticInjectable<typeof TestClass> {
            public propertyA = "test";
            public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
          }
          class TestClass2 implements StaticInjectable<typeof TestClass2> {
            constructor(public test: TestClass) {}
            public static [STATIC_INJECTIONS] = ["test"];
          }
          container.register("test", { useClass: TestClass });
          const test2 = container.resolve(TestClass2);
          expect(test2.test.propertyA).toBe("test");
        });
        test("Example 2", () => {
          class TestClass implements StaticInjectable<typeof TestClass> {
            public propertyA = "test";
            public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
          }
          class TestClass2 implements StaticInjectable<typeof TestClass2> {
            constructor(public test: TestClass) {}
            public static [STATIC_INJECTIONS] = [TestClass];
          }
          const test2 = container.resolve(TestClass2);
          expect(test2.test.propertyA).toBe("test");
        });
      });
    });
    describe("Decorators", () => {
      test("empty singleton", () => {
        @Singleton()
        class TestClass {}
        const instance1 = container.resolve(TestClass);
        expect(instance1).toBeInstanceOf(TestClass);
      });
      test("with registration token", () => {
        @Singleton("serviceA") //With token to register
        class ServiceA {}
        @Singleton(["serviceA"]) //With an array of dependencies to resolve when creating the instance
        class ServiceB {
          constructor(public serviceA: ServiceA) {}
        }
        const b = container.resolve<ServiceB>(ServiceB);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
      });
      test("empty token with dependencies", () => {
        @Singleton()
        class ServiceA {}
        @Singleton([ServiceA]) //With an array of dependencies to resolve when creating the instance
        class ServiceB {
          constructor(public serviceA: ServiceA) {}
        }
        const b = container.resolve<ServiceB>(ServiceB);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
      });
      test("empty scoped without scope", () => {
        @Scoped()
        class TestClass {}
        expect(() => container.resolve(TestClass)).toThrow(UndefinedScopeError);
      });
      test("empty scoped with scope", () => {
        @Scoped()
        class TestClass {}
        const scope = container.createScope();
        const instance1 = container.resolve(TestClass, scope);
        expect(instance1).toBeInstanceOf(TestClass);
      });
    });
    describe("API", () => {
      describe("Container", () => {
        test("test token", () => {
          const JWT_SECRET = new Token("jwt_secret");
          container.registerValue(JWT_SECRET, "my secure secret");
          const secret = container.resolve(JWT_SECRET);
          expect(secret).toBe("my secure secret");
        });
      });
    });
  });
});
