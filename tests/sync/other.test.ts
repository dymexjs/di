import { beforeEach, describe, test } from "node:test";
import { Container, container } from "../../src/container";
import { TokenNotFoundError } from "../../src/exceptions/TokenNotFoundError";
import { Lifetime } from "../../src/types/registration.interface";
import { Singleton } from "../../src/decorators";
import { TokenRegistrationCycleError } from "../../src/exceptions/TokenRegistrationCycleError";
import * as assert from "node:assert/strict";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => container.reset());
  describe("sync", () => {
    describe("other", () => {
      describe("register and resolve", () => {
        test("should throw an error when token not registered", () => {
          assert.throws(() => container.resolve("test"), TokenNotFoundError);
        });
      });
      describe("direct resolve", () => {
        test("should resolve directly in constructor param", () => {
          @Singleton()
          class Test {}
          @Singleton()
          class Test2 {
            constructor(public readonly test: Test = container.resolve(Test)) {}
          }
          const test2 = container.resolve(Test2);
          const test = container.resolve(Test);
          assert.ok(test2 instanceof Test2);
          assert.ok(test instanceof Test);
          assert.ok(test2.test instanceof Test);
          assert.strictEqual(test2.test, test);
        });
      });
      describe("resolveAll", () => {
        test("fails to resolveAll unregistered dependency by name sync", () => {
          assert.throws(
            () => container.resolveAll("NotRegistered"),
            TokenNotFoundError,
          );
        });
        test("resolves an array of transient instances bound to a single interface", () => {
          interface FooInterface {
            bar: string;
          }

          class FooOne implements FooInterface {
            public bar = "foo1";
          }

          class FooTwo implements FooInterface {
            public bar = "foo2";
          }

          container.register<FooInterface>("FooInterface", {
            useClass: FooOne,
          });
          container.register<FooInterface>("FooInterface", {
            useClass: FooTwo,
          });

          const fooArray = container.resolveAll<FooInterface>("FooInterface");
          assert.ok(Array.isArray(fooArray));
          assert.ok(fooArray[0] instanceof FooOne);
          assert.ok(fooArray[1] instanceof FooTwo);
        });

        test("resolves all transient instances when not registered", () => {
          class Foo {}

          const foo1 = container.resolveAll(Foo);
          const foo2 = container.resolveAll(Foo);

          assert.ok(Array.isArray(foo1));
          assert.ok(Array.isArray(foo2));
          assert.ok(foo1[0] instanceof Foo);
          assert.ok(foo2[0] instanceof Foo);
          assert.notStrictEqual(foo1[0], foo2[0]);
        });
      });
      describe("Child Container", () => {
        test("should create a child container", () => {
          const childContainer = container.createChildContainer();
          assert.ok(childContainer instanceof Container);
        });
        test("should resolve in child container", () => {
          const childContainer = container.createChildContainer();
          childContainer.register("test", { useValue: "test" });
          assert.strictEqual(childContainer.resolve("test"), "test");
          assert.throws(() => container.resolve("test"), TokenNotFoundError);
        });
        test("should resolve in parent container", () => {
          const childContainer = container.createChildContainer();
          container.register("test", { useValue: "test" });
          assert.strictEqual(container.resolve("test"), "test");
          assert.strictEqual(childContainer.resolve("test"), "test");
        });
        test("should resolve scoped", () => {
          class Test {
            propertyA = "test";
          }
          container.register("test", Test, { lifetime: Lifetime.Scoped });
          const childContainer = container.createChildContainer();
          const scope = childContainer.createScope();
          assert.strictEqual(
            childContainer.resolve<Test>("test", scope).propertyA,
            "test",
          );
        });
        test("child container resolves even when parent doesn't have registration", () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          assert.ok(childContainer.resolve<Foo>("IFoo") instanceof Foo);
        });
        test("child container resolves using parent's registration when child container doesn't have registration", () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          assert.ok(childContainer.resolve<Foo>("IFoo") instanceof Foo);
        });
        test("child container resolves all even when parent doesn't have registration", () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          const myFoo = childContainer.resolveAll<IFoo>("IFoo");
          assert.ok(myFoo instanceof Array);
          assert.strictEqual(myFoo.length, 1);
          assert.ok(myFoo[0] instanceof Foo);
        });

        test("child container resolves all using parent's registration when child container doesn't have registration", () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          const myFoo = childContainer.resolveAll<IFoo>("IFoo");
          assert.ok(myFoo instanceof Array);
          assert.strictEqual(myFoo.length, 1);
          assert.ok(myFoo[0] instanceof Foo);
        });
        test("should not create a new instance of requested singleton service", () => {
          @Singleton()
          class Bar {}

          const bar1 = container.resolve(Bar);

          assert.ok(bar1 instanceof Bar);

          const childContainer = container.createChildContainer();
          const bar2 = childContainer.resolve(Bar);

          assert.ok(bar2 instanceof Bar);
          assert.strictEqual(bar1, bar2);
        });
      });
      describe("registerType", () => {
        test("registerType() allows for classes to be swapped", () => {
          class Bar {}
          class Foo {}
          container.registerType(Bar, Foo);

          assert.ok(container.resolve(Bar) instanceof Foo);
        });

        test("registerType() allows for names to be registered for a given type", () => {
          class Bar {}
          container.registerType("CoolName", Bar);

          assert.ok(container.resolve("CoolName") instanceof Bar);
        });

        test("registerType() doesn't allow tokens to point to themselves", () => {
          assert.throws(
            () => container.registerType("Bar", "Bar"),
            TokenRegistrationCycleError,
          );
        });

        test("registerType() doesn't allow registration cycles", () => {
          container.registerType("Bar", "Foo");
          container.registerType("Foo", "FooBar");

          assert.throws(
            () => container.registerType("FooBar", "Bar"),
            TokenRegistrationCycleError,
          );
        });
      });
    });
  });
});
