import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../../src/di/container";
import { STATIC_INJECTIONS, STATIC_INJECTION_LIFETIME } from "../../../src/di/constants";
import { Lifetime } from "../../../src/di/types/registration.interface";
import { StaticInjectable } from "../../../src/di/types/static-inject.interface";

describe("Averix_DI", () => {
  beforeEach(async () => await container.reset());
  describe("sync", () => {
    describe("Static Injector", () => {
      test("should register and resolve with static injector", () => {
        class TestClass {
          public propertyA = "test";
        }
        class TestClass2 {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["test"];
        }
        container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Singleton });
        const test2 = container.resolve(TestClass2);
        const test = container.resolve<TestClass>("test");
        expect(test2).toBeInstanceOf(TestClass2);
        expect(test2.test).toBeInstanceOf(TestClass);
        expect(test2.test.propertyA).toBe("test");
        expect(test2.test).toBe(test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        expect(test3).toBeInstanceOf(TestClass);
        expect(test3.propertyA).toBe("test2");
        expect(test2.test).toBe(test3);
      });
      test("should register singleton from STATIC_INJECTION_LIFETIME", () => {
        class TestClass {
          public propertyA = "test";
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        class TestClass2 {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["test"];
        }
        container.register("test", { useClass: TestClass });
        const test2 = container.resolve(TestClass2);
        const test = container.resolve<TestClass>("test");
        expect(test2).toBeInstanceOf(TestClass2);
        expect(test2.test).toBeInstanceOf(TestClass);
        expect(test2.test.propertyA).toBe("test");
        expect(test2.test).toBe(test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        expect(test3).toBeInstanceOf(TestClass);
        expect(test3.propertyA).toBe("test2");
        expect(test2.test).toBe(test3);
      });
      test("should register singleton from impements StaticInjectable", () => {
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
        const test = container.resolve<TestClass>("test");
        expect(test2).toBeInstanceOf(TestClass2);
        expect(test2.test).toBeInstanceOf(TestClass);
        expect(test2.test.propertyA).toBe("test");
        expect(test2.test).toBe(test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        expect(test3).toBeInstanceOf(TestClass);
        expect(test3.propertyA).toBe("test2");
        expect(test2.test).toBe(test3);
      });
    });
  });
});
