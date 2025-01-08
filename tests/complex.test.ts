import { beforeEach, describe, test } from "node:test";
import { container } from "../src/container";
import * as assert from "node:assert/strict";
import { UndefinedScopeError } from "../src/exceptions/UndefinedScopeError";
import { Scoped, Singleton, Transient } from "../src/decorators";
import { TokenNotFoundError } from "../src/exceptions";

describe("Container Complex Scenarios", () => {
  beforeEach(async () => await container.reset());

  describe("Nested Dependency Resolution", () => {
    test("should resolve deeply nested dependencies with mixed lifetimes", () => {
      @Singleton()
      class Level3 {
        value = "level3";
      }
      @Transient([Level3])
      class Level2 {
        constructor(public l3: Level3) {}
        value = "level2";
      }
      @Scoped([Level2])
      class Level1 {
        constructor(public l2: Level2) {}
        value = "level1";
      }
      @Transient("root", [Level1])
      class Root {
        constructor(public l1: Level1) {}
        value = "root";
      }

      const scope1 = container.createScope();
      const scope2 = container.createScope();

      const instance1 = container.resolve<Root>("root", scope1);
      const instance2 = container.resolve<Root>("root", scope2);

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
        constructor(public a: ServiceA) {}
        value = "B";
      }
      class ServiceC {
        constructor(public b: ServiceB) {}
        value = "C";
      }

      const childContainer = container.createChildContainer();
      const scope1 = container.createScope();
      const scope2 = childContainer.createScope();

      container.registerSingleton("serviceA", ServiceA);
      childContainer.registerScoped("serviceB", ServiceB, ["serviceA"]);
      container.registerTransient("serviceC", ServiceC, ["serviceB"]);

      assert.throws(() => container.resolve<ServiceB>("serviceB"), TokenNotFoundError);
      const instance1 = childContainer.resolve<ServiceC>("serviceC", scope1);
      const instance2 = childContainer.resolve<ServiceC>("serviceC", scope2);

      assert.notStrictEqual(instance1, instance2);
      assert.strictEqual(instance1.b.a, instance2.b.a);
      assert.notStrictEqual(instance1.b, instance2.b);

      await container.disposeScope(scope1);
      await assert.rejects(() => container.resolveAsync("serviceC", scope1), TokenNotFoundError);
      const instance3 = childContainer.resolve<ServiceC>("serviceC", scope2);
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
        constructor(public value: string) {}
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
      await assert.rejects(() => grandchild2.resolveAsync("service"), TokenNotFoundError);
    });
  });

  describe("Complex Circular Dependencies", () => {
    test("should resolve circular dependencies with mixed lifetimes", () => {
      class ServiceA {
        constructor(public b?: ServiceB) {}
        value = "A";
      }
      class ServiceB {
        constructor(public c: ServiceC) {}
        value = "B";
      }
      class ServiceC {
        constructor(public a: ServiceA) {}
        value = "C";
      }

      container.registerTransient("serviceA", ServiceA, ["serviceB"]);
      container.registerSingleton("serviceB", ServiceB, ["serviceC"]);
      container.registerScoped("serviceC", ServiceC, ["serviceA"]);

      const scope = container.createScope();
      const instanceA = container.resolve<ServiceA>("serviceA", scope);
      const instanceB = container.resolve<ServiceB>("serviceB", scope);
      const instanceC = container.resolve<ServiceC>("serviceC", scope);

      assert.strictEqual(instanceA.b, instanceB);
      assert.strictEqual(instanceB.c, instanceC);
      assert.notStrictEqual(instanceC.a, instanceA);
      assert.strictEqual(instanceC.a.b, instanceB);
    });
  });
});
