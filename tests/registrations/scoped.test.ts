import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";

import { container } from "../../src/index.ts";

describe("Registrations", () => {
  beforeEach(async () => {
    await container.dispose();
  });
  describe("Scoped", () => {
    test("should register a scoped", () => {
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class Test {}
      container.addScoped(Test);
      const scope = container.createScope();
      const instance1 = scope.resolve(Test);
      const instance2 = scope.resolve(Test);
      assert.strictEqual(instance1, instance2);
    });
  });
});
