import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";

import { container } from "../../src/index.ts";

describe("Registrations", () => {
  beforeEach(async () => {
    await container.dispose();
  });
  describe("Transient", () => {
    test("should register a transient", () => {
      class Test {
        public readonly testArr: Array<number>;

        constructor(testArray: Array<number>) {
          this.testArr = testArray;
        }
      }
      const array = [1, 2, 3];
      container.registerValue("array", array);
      container.addTransient(Test, ["array"]);
      const instance1 = container.resolve(Test);
      const instance2 = container.resolve(Test);
      assert.notStrictEqual(instance1, instance2);
      assert.deepStrictEqual(instance1, instance2);
    });
  });
});
