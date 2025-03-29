import * as assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  container,
  Lifetime,
  STATIC_INJECTION_LIFETIME,
  STATIC_INJECTIONS,
  type StaticInjectable,
} from "../../src/index.ts";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.dispose());
  describe("sync", () => {
    describe("Static Injector", () => {
      test("should register and resolve with static injector", () => {
        class TestClass {
          public propertyA = "test";
        }
        class TestClass2 {
          public static readonly [STATIC_INJECTIONS] = ["test"];

          public test: TestClass;

          // eslint-disable-next-line sonarjs/no-nested-functions
          constructor(test: TestClass) {
            this.test = test;
          }
        }
        container.register(
          "test",
          { useClass: TestClass },
          { lifetime: Lifetime.Singleton },
        );
        const test2 = container.resolve(TestClass2);
        const test = container.resolve<TestClass>("test");
        assert.ok(test2 instanceof TestClass2);
        assert.ok(test2.test instanceof TestClass);
        assert.strictEqual(test2.test.propertyA, "test");
        assert.strictEqual(test2.test, test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        assert.ok(test3 instanceof TestClass);
        assert.strictEqual(test3.propertyA, "test2");
        assert.strictEqual(test2.test, test3);
      });
      test("should register singleton from STATIC_INJECTION_LIFETIME", () => {
        class TestClass {
          public static readonly [STATIC_INJECTION_LIFETIME] =
            Lifetime.Singleton;

          public propertyA = "test";
        }
        class TestClass2 {
          public static readonly [STATIC_INJECTIONS] = ["test"];

          public test: TestClass;

          // eslint-disable-next-line sonarjs/no-nested-functions
          constructor(test: TestClass) {
            this.test = test;
          }
        }
        container.register("test", { useClass: TestClass });
        const test2 = container.resolve(TestClass2);
        const test = container.resolve<TestClass>("test");
        assert.ok(test2 instanceof TestClass2);
        assert.ok(test2.test instanceof TestClass);
        assert.strictEqual(test2.test.propertyA, "test");
        assert.strictEqual(test2.test, test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        assert.ok(test3 instanceof TestClass);
        assert.strictEqual(test3.propertyA, "test2");
        assert.strictEqual(test2.test, test3);
      });
      test("should register singleton from impements StaticInjectable", () => {
        class TestClass implements StaticInjectable<typeof TestClass> {
          public static readonly [STATIC_INJECTION_LIFETIME] =
            Lifetime.Singleton;

          public propertyA = "test";
        }
        class TestClass2 implements StaticInjectable<typeof TestClass2> {
          public static readonly [STATIC_INJECTIONS] = ["test"];

          public test: TestClass;

          // eslint-disable-next-line sonarjs/no-nested-functions
          constructor(test: TestClass) {
            this.test = test;
          }
        }
        container.register("test", { useClass: TestClass });
        const test2 = container.resolve(TestClass2);
        const test = container.resolve<TestClass>("test");
        assert.ok(test2 instanceof TestClass2);
        assert.ok(test2.test instanceof TestClass);
        assert.strictEqual(test2.test.propertyA, "test");
        assert.strictEqual(test2.test, test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        assert.ok(test3 instanceof TestClass);
        assert.strictEqual(test3.propertyA, "test2");
        assert.strictEqual(test2.test, test3);
      });
    });
  });
});
