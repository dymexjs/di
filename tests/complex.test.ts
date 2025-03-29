import * as assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  container,
  Scoped,
  Singleton,
  TokenNotFoundError,
  Transient,
  UndefinedScopeError,
} from "../src/index.ts";

describe("Container Complex Scenarios", () => {
  beforeEach(async () => await container.dispose());

  describe("Nested Dependency Resolution", () => {
    test("should resolve deeply nested dependencies with mixed lifetimes", () => {
      @Singleton()
      class Level3 {
        value = "level3";
      }
      @Transient([Level3])
      class Level2 {
        public l3: Level3;
        value = "level2";

        constructor(l3: Level3) {
          this.l3 = l3;
        }
      }
      @Scoped([Level2])
      class Level1 {
        public l2: Level2;
        value = "level1";

        constructor(l2: Level2) {
          this.l2 = l2;
        }
      }
      @Transient("root", [Level1])
      class Root {
        public l1: Level1;
        value = "root";

        constructor(l1: Level1) {
          this.l1 = l1;
        }
      }

      const scope1 = container.createScope();
      const scope2 = container.createScope();

      const instance1 = scope1.resolve<Root>("root");
      const instance2 = scope2.resolve<Root>("root");

      assert.notStrictEqual(instance1, instance2);
      assert.notStrictEqual(instance1.l1, instance2.l1);
      assert.notStrictEqual(instance1.l1.l2, instance2.l1.l2);
      assert.strictEqual(instance1.l1.l2.l3, instance2.l1.l2.l3);
    });
  });

  describe("Complex Lifetime Management", () => {
    test("should handle mixed lifetime scopes with child containers", async () => {
      class ServiceA {
        value = "A";
      }
      class ServiceB {
        public a: ServiceA;
        value = "B";

        constructor(a: ServiceA) {
          this.a = a;
        }
      }
      class ServiceC {
        public b: ServiceB;
        value = "C";

        constructor(b: ServiceB) {
          this.b = b;
        }
      }

      const childContainer = container.createChildContainer();
      const scope1 = container.createScope();
      const scope2 = childContainer.createScope();

      container.registerSingleton("serviceA", ServiceA);
      childContainer.registerScoped("serviceB", ServiceB, ["serviceA"]);
      container.registerTransient("serviceC", ServiceC, ["serviceB"]);

      assert.throws(
        () => container.resolve<ServiceB>("serviceB"),
        TokenNotFoundError,
      );
      const instance2 = scope2.resolve<ServiceC>("serviceC");
      assert.throws(
        () => scope1.resolve<ServiceC>("serviceC"),
        TokenNotFoundError,
      );

      await assert.rejects(
        () => scope1.resolveAsync("serviceC"),
        TokenNotFoundError,
      );
      const instance3 = scope2.resolve<ServiceC>("serviceC");
      assert.notStrictEqual(instance2, instance3);
    });
  });

  describe("Complex Error Handling", () => {
    test("should handle registration errors appropriately", () => {
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class Service {}

      // Test duplicate registration
      container.registerSingleton("service", Service);
      container.registerSingleton("service", Service);

      // Test circular token provider
      assert.throws(() => {
        container.register("a", { useToken: "b" });
        container.register("b", { useToken: "a" });
      });

      // Test undefined scope for scoped service
      container.registerScoped("scoped", Service);
      assert.throws(() => {
        container.resolve("scoped");
      }, UndefinedScopeError);
    });
  });

  describe("Multiple Child Container Hierarchies", () => {
    test("should handle complex container hierarchies", async () => {
      class Service {
        public value: string;

        constructor(value: string) {
          this.value = value;
        }
      }

      const child1 = container.createChildContainer();
      const child2 = container.createChildContainer();
      const grandchild1 = child1.createChildContainer();
      const grandchild2 = child2.createChildContainer();

      container.registerValue("service", new Service("root"));
      child1.registerValue("service", new Service("child1"));
      grandchild2.registerValue("service", new Service("grandchild2"));

      const rootInstance = container.resolve<Service>("service");
      const child1Instance = child1.resolve<Service>("service");
      const child2Instance = child2.resolve<Service>("service");
      const grandchild1Instance = grandchild1.resolve<Service>("service");
      const grandchild2Instance = grandchild2.resolve<Service>("service");

      assert.strictEqual(rootInstance.value, "root");
      assert.strictEqual(child1Instance.value, "child1");
      assert.strictEqual(child2Instance.value, "root");
      assert.strictEqual(grandchild1Instance.value, "child1");
      assert.strictEqual(grandchild2Instance.value, "grandchild2");

      await container[Symbol.asyncDispose]();
      await assert.rejects(
        () => grandchild2.resolveAsync("service"),
        TokenNotFoundError,
      );
    });
  });

  describe("Complex Circular Dependencies", () => {
    test("should resolve circular dependencies with mixed lifetimes", () => {
      class ServiceA {
        public b?: ServiceB;
        value = "A";

        constructor(b?: ServiceB) {
          this.b = b;
        }
      }
      class ServiceB {
        public c: ServiceC;
        value = "B";

        constructor(c: ServiceC) {
          this.c = c;
        }
      }
      class ServiceC {
        public a: ServiceA;
        value = "C";

        constructor(a: ServiceA) {
          this.a = a;
        }
      }

      container.registerTransient("serviceA", ServiceA, ["serviceB"]);
      container.registerSingleton("serviceB", ServiceB, ["serviceC"]);
      container.registerScoped("serviceC", ServiceC, ["serviceA"]);

      const scope = container.createScope();
      const instanceA = scope.resolve<ServiceA>("serviceA");
      const instanceB = scope.resolve<ServiceB>("serviceB");
      const instanceC = scope.resolve<ServiceC>("serviceC");

      assert.strictEqual(instanceA.b, instanceB);
      assert.strictEqual(instanceB.c, instanceC);
      assert.notStrictEqual(instanceC.a, instanceA);
      assert.strictEqual(instanceC.a.b, instanceB);
    });
  });
});
