import { beforeEach, describe, test } from "node:test";
import * as assert from "node:assert/strict";
import { container, Lifetime, STATIC_INJECTION_LIFETIME, STATIC_INJECTIONS, StaticInjectable } from "../../src";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("Static Injector", () => {
      test("should register and resolveAsync with static injector", async () => {
        class TestClass {
          public propertyA = "test";
        }
        class TestClass2 {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["test"];
        }
        container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Singleton });
        const test2 = await container.resolveAsync(TestClass2);
        const test = await container.resolveAsync<TestClass>("test");
        assert.ok(test2 instanceof TestClass2);
        assert.ok(test2.test instanceof TestClass);
        assert.strictEqual(test2.test.propertyA, "test");
        assert.strictEqual(test2.test, test);
        test.propertyA = "test2";
        const test3 = await container.resolveAsync<TestClass>("test");
        assert.ok(test3 instanceof TestClass);
        assert.strictEqual(test3.propertyA, "test2");
        assert.strictEqual(test2.test, test3);
      });
      test("should register singleton from STATIC_INJECTION_LIFETIME", async () => {
        class TestClass {
          public propertyA = "test";
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        class TestClass2 {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["test"];
        }
        container.register("test", { useClass: TestClass });
        const test2 = await container.resolveAsync(TestClass2);
        const test = await container.resolveAsync<TestClass>("test");
        assert.ok(test2 instanceof TestClass2);
        assert.ok(test2.test instanceof TestClass);
        assert.strictEqual(test2.test.propertyA, "test");
        assert.strictEqual(test2.test, test);
        test.propertyA = "test2";
        const test3 = await container.resolveAsync<TestClass>("test");
        assert.ok(test3 instanceof TestClass);
        assert.strictEqual(test3.propertyA, "test2");
        assert.strictEqual(test2.test, test3);
      });
      test("should register singleton from impements StaticInjectable", async () => {
        class TestClass implements StaticInjectable<typeof TestClass> {
          public propertyA = "test";
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        class TestClass2 implements StaticInjectable<typeof TestClass2> {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["test"];
        }
        container.register("test", { useClass: TestClass });
        const test2 = await container.resolveAsync(TestClass2);
        const test = await container.resolveAsync<TestClass>("test");
        assert.ok(test2 instanceof TestClass2);
        assert.ok(test2.test instanceof TestClass);
        assert.strictEqual(test2.test.propertyA, "test");
        assert.strictEqual(test2.test, test);
        test.propertyA = "test2";
        const test3 = await container.resolveAsync<TestClass>("test");
        assert.ok(test3 instanceof TestClass);
        assert.strictEqual(test3.propertyA, "test2");
        assert.strictEqual(test2.test, test3);
      });
    });
  });
});
