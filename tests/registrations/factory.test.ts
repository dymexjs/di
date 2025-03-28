/* eslint-disable unicorn/consistent-function-scoping */
import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";

import {
  container,
  getInterfaceToken,
  type IContainer,
} from "../../src/index.ts";

describe("Registrations", () => {
  beforeEach(async () => {
    await container.dispose();
  });
  describe("Factory", () => {
    test("should register a factory", () => {
      const factory = () => [1, 2, 3];
      container.registerFactory("a", factory);
      assert.deepStrictEqual(container.resolve("a"), [1, 2, 3]);
    });
    test("should register an async factory", async () => {
      const factory = async () => [1, 2, 3];
      container.registerFactory("a", factory);
      assert.deepStrictEqual(await container.resolveAsync("a"), [1, 2, 3]);
    });
    test("should inject IContainer into factory", () => {
      const a = [1, 2, 3];
      const factory = (container: IContainer) => container.resolve("a");
      container.registerValue("a", a);
      container.registerFactory("factory", factory, [
        getInterfaceToken("IContainer"),
      ]);
      assert.deepStrictEqual(container.resolve("factory"), a);
    });
    test("should inject IContainer into async factory", async () => {
      const a = [1, 2, 3];
      const factory = async (container: IContainer) =>
        container.resolveAsync("a");
      container.registerValue("a", a);
      container.registerFactory("factory", factory, [
        getInterfaceToken("IContainer"),
      ]);
      assert.deepStrictEqual(await container.resolveAsync("factory"), a);
    });
    test("should inject other dependencies into factory", () => {
      const array = [1, 2, 3];
      const factoryA = (a: Array<number>) => a;
      const factoryB = (b: typeof factoryA) => b;
      container.registerValue("arr", array);
      container.registerFactory("factoryA", factoryA, ["arr"]);
      container.registerFactory("factoryB", factoryB, ["factoryA"]);
      assert.deepStrictEqual(container.resolve("factoryB"), array);
      assert.deepStrictEqual(
        container.resolve("factoryB"),
        container.resolve("arr"),
      );
    });
    test("should inject other dependencies into async factory", async () => {
      const array = [1, 2, 3];
      const factoryA = async (a: Array<number>) => a;
      const factoryB = async (b: typeof factoryA) => b;
      container.registerValue("arr", array);
      container.registerFactory("factoryA", factoryA, ["arr"]);
      container.registerFactory("factoryB", factoryB, ["factoryA"]);
      assert.deepStrictEqual(await container.resolveAsync("factoryB"), array);
      assert.deepStrictEqual(
        await container.resolveAsync("factoryB"),
        await container.resolveAsync("arr"),
      );
    });
    test("multiple dependencies", () => {
      const array = [1, 2, 3];
      const array2 = [4, 5, 6];
      class Test {
        public readonly testArr: Array<number>;

        constructor(testArray: Array<number>) {
          this.testArr = testArray;
        }
      }
      class Test2 {
        public readonly testArr: Array<number>;

        constructor(testArray: Array<number>) {
          this.testArr = testArray;
        }
      }
      class Test3 {
        public readonly test2: Test2;

        constructor(test2: Test2) {
          this.test2 = test2;
        }
      }
      const factoryA = (a: Array<number>) => a;
      const factoryB = (testClass: Test) => {
        return testClass;
      };
      const factoryC = (cont: IContainer) => {
        return cont.resolve(Test3);
      };
      container.registerValue("arr", array);
      container.registerValue("arr2", array2);
      container.addSingleton(Test, ["arr"]);
      container.addSingleton(Test2, ["arr2"]);
      container.addSingleton(Test3, [Test2]);
      container.registerFactory("factoryA", factoryA, ["arr"]);
      container.registerFactory("factoryB", factoryB, [Test]);
      container.registerFactory("factoryC", factoryC, [
        getInterfaceToken("IContainer"),
      ]);
      assert.strictEqual(container.resolve<Test>("factoryB").testArr, array);
      assert.strictEqual(container.resolve("factoryA"), array);
      assert.strictEqual(
        container.resolve<Test>("factoryB").testArr,
        container.resolve("factoryA"),
      );
      assert.strictEqual(
        container.resolve(Test3).test2,
        container.resolve(Test2),
      );
      assert.strictEqual(
        container.resolve<Test3>("factoryC").test2.testArr,
        container.resolve("arr2"),
      );
    });
    test("multiple dependencies async", async () => {
      const array = [1, 2, 3];
      const array2 = [4, 5, 6];
      class Test {
        public readonly testArr: Array<number>;

        constructor(testArray: Array<number>) {
          this.testArr = testArray;
        }
      }
      class Test2 {
        public readonly testArr: Array<number>;

        constructor(testArray: Array<number>) {
          this.testArr = testArray;
        }
      }
      class Test3 {
        public readonly test2: Test2;

        constructor(test2: Test2) {
          this.test2 = test2;
        }
      }
      const factoryA = async (a: Array<number>) => a;
      const factoryB = async (testClass: Test) => {
        return testClass;
      };
      const factoryC = async (cont: IContainer) => {
        return cont.resolveAsync(Test3);
      };
      container.registerValue("arr", array);
      container.registerValue("arr2", array2);
      container.addSingleton(Test, ["arr"]);
      container.addSingleton(Test2, ["arr2"]);
      container.addSingleton(Test3, [Test2]);
      container.registerFactory("factoryA", factoryA, ["arr"]);
      container.registerFactory("factoryB", factoryB, [Test]);
      container.registerFactory("factoryC", factoryC, [
        getInterfaceToken("IContainer"),
      ]);
      assert.strictEqual(
        // eslint-disable-next-line unicorn/no-await-expression-member
        (await container.resolveAsync<Test>("factoryB")).testArr,
        array,
      );
      assert.strictEqual(await container.resolveAsync("factoryA"), array);
      assert.strictEqual(
        // eslint-disable-next-line unicorn/no-await-expression-member
        (await container.resolveAsync<Test>("factoryB")).testArr,
        await container.resolveAsync("factoryA"),
      );
      assert.strictEqual(
        // eslint-disable-next-line unicorn/no-await-expression-member
        (await container.resolveAsync(Test3)).test2,
        await container.resolveAsync(Test2),
      );
      assert.strictEqual(
        // eslint-disable-next-line unicorn/no-await-expression-member
        (await container.resolveAsync<Test3>("factoryC")).test2.testArr,
        await container.resolveAsync("arr2"),
      );
    });
  });
});
