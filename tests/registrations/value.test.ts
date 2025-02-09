import test, { beforeEach, describe } from "node:test";
import { container } from "../../src/index.ts";
import assert from "node:assert";

describe("Registrations", () => {
  beforeEach(async () => {
    await container.dispose();
  });
  describe("Value", () => {
    test("should register a value", () => {
      const a = [1, 2, 3];
      const b = { a: 1, b: 2 };
      container.registerValue("a", a);
      container.registerValue("b", b);
      assert.strictEqual(container.resolve("a"), a);
      assert.strictEqual(container.resolve("b"), b);
    });
  });
});
