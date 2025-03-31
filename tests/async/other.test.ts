/* eslint-disable sonarjs/no-nested-functions */
import * as assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  container,
  Lifetime,
  Singleton,
  TokenNotFoundError,
  Transient,
} from "../../src/index.ts";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => container.dispose());
  describe("async", () => {
    describe("other", () => {
      describe("register and resolve", () => {
        test("should throw an error when token not registered async", () => {
          assert.rejects(container.resolveAsync("test"), TokenNotFoundError);
        });
      });
      describe("asyncDispose", () => {
        test("should handle async dispose", async () => {
          class TestAsyncDisposable implements AsyncDisposable {
            async [Symbol.asyncDispose](): Promise<void> {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
          container.register("asyncDisposable", TestAsyncDisposable, {
            lifetime: Lifetime.Singleton,
          });
          container.resolve("asyncDisposable");
          const startTime = Date.now();
          await container.clearInstances();
          const endTime = Date.now();
          assert.ok(endTime - startTime > 90);
        });
      });
      describe("resolveAll", () => {
        test("fails to resolveAll unregistered dependency by name sync", () => {
          assert.rejects(
            container.resolveAllAsync("NotRegistered"),
            TokenNotFoundError,
          );
        });
        test("resolves an array of singleton instances bound to a single interface", async () => {
          interface FooInterface {
            bar: string;
          }

          class FooOne implements FooInterface {
            public bar = "foo1";
          }

          class FooTwo implements FooInterface {
            public bar = "foo2";
          }

          container.registerSingleton<FooInterface>("FooInterface", {
            useClass: FooOne,
          });
          container.registerSingleton<FooInterface>("FooInterface", {
            useClass: FooTwo,
          });

          const fooArray =
            await container.resolveAllAsync<FooInterface>("FooInterface");
          assert.ok(Array.isArray(fooArray));
          assert.ok(fooArray[0] instanceof FooOne);
          assert.ok(fooArray[1] instanceof FooTwo);
        });
        test("resolves an array of transient instances bound to a single interface", async () => {
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

          const fooArray =
            await container.resolveAllAsync<FooInterface>("FooInterface");
          assert.ok(Array.isArray(fooArray));
          assert.ok(fooArray[0] instanceof FooOne);
          assert.ok(fooArray[1] instanceof FooTwo);
        });
        test("resolves an array of scoped instances bound to a single interface in scope context", async () => {
          interface FooInterface {
            bar: string;
          }

          class FooOne implements FooInterface {
            public bar = "foo1";
          }

          class FooTwo implements FooInterface {
            public bar = "foo2";
          }

          container.registerScoped<FooInterface>("FooInterface", {
            useClass: FooOne,
          });
          container.registerScoped<FooInterface>("FooInterface", {
            useClass: FooTwo,
          });

          const scope = container.createScope();

          const fooArray =
            await scope.resolveAllAsync<FooInterface>("FooInterface");
          assert.ok(Array.isArray(fooArray));
          assert.ok(fooArray[0] instanceof FooOne);
          assert.ok(fooArray[1] instanceof FooTwo);
        });
        test("resolves all transient instances when not registered", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Foo {}

          const foo1 = await container.resolveAllAsync(Foo);
          const foo2 = await container.resolveAllAsync(Foo);

          assert.ok(Array.isArray(foo1));
          assert.ok(Array.isArray(foo2));
          assert.ok(foo1[0] instanceof Foo);
          assert.ok(foo2[0] instanceof Foo);
          assert.notStrictEqual(foo1[0], foo2[0]);
        });
        test("allows array dependencies to be resolved if a single instance is in the container", () => {
          @Transient()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Foo {}

          @Transient()
          class Bar {
            public foo: Array<Foo>;

            constructor(foo: Array<Foo> = container.resolveAll(Foo)) {
              this.foo = foo;
            }
          }

          const bar = container.resolve(Bar);
          assert.strictEqual(bar.foo.length, 1);
        });
      });
      describe("clearInstances", () => {
        test("clears cached instances from container.resolve() calls", async () => {
          class Foo implements AsyncDisposable {
            async [Symbol.asyncDispose](): Promise<void> {
              return new Promise((resolve) => setTimeout(resolve, 10));
            }
          }
          container.register(Foo, Foo, { lifetime: Lifetime.Singleton });
          const instance1 = container.resolve(Foo);

          await container.clearInstances();

          // Foo should still be registered as singleton
          const instance2 = container.resolve(Foo);
          const instance3 = container.resolve(Foo);

          assert.notStrictEqual(instance1, instance2);
          assert.strictEqual(instance2, instance3);
          assert.ok(instance3 instanceof Foo);
        });
      });
      describe("Child Container", () => {
        test("should resolve in child container", async () => {
          const childContainer = container.createChildContainer();
          childContainer.register("test", { useValue: "test" });
          assert.strictEqual(await childContainer.resolveAsync("test"), "test");
          assert.rejects(container.resolveAsync("test"), TokenNotFoundError);
        });
        test("should resolve in parent container", async () => {
          const childContainer = container.createChildContainer();
          container.register("test", { useValue: "test" });
          assert.strictEqual(await container.resolveAsync("test"), "test");
          assert.strictEqual(await childContainer.resolveAsync("test"), "test");
        });
        test("should resolve scoped", async () => {
          class Test {
            propertyA = "test";
          }
          container.register("test", Test, { lifetime: Lifetime.Scoped });
          const childContainer = container.createChildContainer();
          const scope = childContainer.createScope();
          assert.strictEqual(
            // eslint-disable-next-line unicorn/no-await-expression-member
            (await scope.resolveAsync<Test>("test")).propertyA,
            "test",
          );
        });
        test("child container resolves even when parent doesn't have registration", async () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          assert.ok(
            (await childContainer.resolveAsync<Foo>("IFoo")) instanceof Foo,
          );
        });
        test("child container resolves using parent's registration when child container doesn't have registration", async () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          assert.ok(
            (await childContainer.resolveAsync<Foo>("IFoo")) instanceof Foo,
          );
        });
        test("child container resolves all even when parent doesn't have registration", async () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          const myFoo = await childContainer.resolveAllAsync<IFoo>("IFoo");
          assert.ok(Array.isArray(myFoo));
          assert.strictEqual(myFoo.length, 1);
          assert.ok(myFoo[0] instanceof Foo);
        });

        test("child container resolves all using parent's registration when child container doesn't have registration", async () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          const myFoo = await childContainer.resolveAllAsync<IFoo>("IFoo");
          assert.ok(Array.isArray(myFoo));
          assert.strictEqual(myFoo.length, 1);
          assert.ok(myFoo[0] instanceof Foo);
        });
        test("should not create a new instance of requested singleton service", async () => {
          @Singleton()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Bar {}

          const bar1 = await container.resolveAsync(Bar);

          assert.ok(bar1 instanceof Bar);

          const childContainer = container.createChildContainer();
          const bar2 = await childContainer.resolveAsync(Bar);

          assert.ok(bar2 instanceof Bar);
          assert.strictEqual(bar1, bar2);
        });
      });
      describe("removeRegistration", () => {
        test("should remove registration", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}
          container.register("test", Test, { lifetime: Lifetime.Singleton });
          container.register("test", Test, { lifetime: Lifetime.Transient });
          const instances = container.resolveAll("test");
          assert.ok(Array.isArray(instances));
          assert.strictEqual(instances.length, 2);
          assert.ok(instances[0] instanceof Test);
          assert.ok(instances[1] instanceof Test);
          assert.notStrictEqual(instances[0], instances[1]);
          await container.removeRegistration(
            "test",
            (reg) => reg.options.lifetime === Lifetime.Transient,
          );
          const instances2 = container.resolveAll("test");
          assert.ok(Array.isArray(instances2));
          assert.strictEqual(instances2.length, 1);
          assert.ok(instances2[0] instanceof Test);
          assert.strictEqual(instances2[0], instances[0]);
          await container.removeRegistration(
            "test",
            (reg) => reg.options.lifetime === Lifetime.Singleton,
          );
          assert.throws(() => container.resolveAll("test"), TokenNotFoundError);
        });
      });
      describe("registerType", () => {
        test("registerType() allows for classes to be swapped", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Bar {}
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Foo {}
          container.registerType(Bar, Foo);

          assert.ok((await container.resolveAsync(Bar)) instanceof Foo);
        });

        test("registerType() allows for names to be registered for a given type", async () => {
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Bar {}
          container.registerType("CoolName", Bar);

          assert.ok(
            (await container.resolveAsync<Bar>("CoolName")) instanceof Bar,
          );
        });
      });
      describe("disposable", async () => {
        @Singleton()
        class Test implements AsyncDisposable {
          public test = "test string";

          async [Symbol.asyncDispose](): Promise<void> {
            this.test = "";
          }
        }
        const test = container.resolve(Test);
        assert.strictEqual(test.test, "test string");
        await container.clearInstances();
        assert.strictEqual(test.test, "");
      });
    });
  });
});
