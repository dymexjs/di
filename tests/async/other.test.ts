import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../src/container";
import { TokenNotFoundError } from "../../src/exceptions/TokenNotFoundError";
import { Lifetime } from "../../src/types/registration.interface";
import { Singleton, Transient } from "../../src/decorators";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => container.reset());
  describe("async", () => {
    describe("other", () => {
      describe("register and resolve", () => {
        test("should throw an error when token not registered async", () => {
          expect(container.resolveAsync("test")).rejects.toThrow(
            TokenNotFoundError,
          );
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
          expect(endTime - startTime).toBeGreaterThanOrEqual(100);
        });
      });
      describe("resolveAll", () => {
        test("fails to resolveAll unregistered dependency by name sync", () => {
          expect(container.resolveAllAsync("NotRegistered")).rejects.toThrow(
            TokenNotFoundError,
          );
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
          expect(Array.isArray(fooArray)).toBeTruthy();
          expect(fooArray[0]).toBeInstanceOf(FooOne);
          expect(fooArray[1]).toBeInstanceOf(FooTwo);
        });
        test("resolves all transient instances when not registered", async () => {
          class Foo {}

          const foo1 = await container.resolveAllAsync(Foo);
          const foo2 = await container.resolveAllAsync(Foo);

          expect(Array.isArray(foo1)).toBeTruthy();
          expect(Array.isArray(foo2)).toBeTruthy();
          expect(foo1[0]).toBeInstanceOf(Foo);
          expect(foo2[0]).toBeInstanceOf(Foo);
          expect(foo1[0]).not.toBe(foo2[0]);
        });
        test("allows array dependencies to be resolved if a single instance is in the container", () => {
          @Transient()
          class Foo {}

          @Transient()
          class Bar {
            constructor(public foo: Foo[] = container.resolveAll(Foo)) {}
          }

          const bar = container.resolve(Bar);
          expect(bar.foo.length).toBe(1);
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

          expect(instance1).not.toBe(instance2);
          expect(instance2).toBe(instance3);
          expect(instance3).toBeInstanceOf(Foo);
        });
      });
      describe("Child Container", () => {
        test("should resolve in child container", () => {
          const childContainer = container.createChildContainer();
          childContainer.register("test", { useValue: "test" });
          expect(childContainer.resolveAsync("test")).resolves.toBe("test");
          expect(container.resolveAsync("test")).rejects.toThrow(
            TokenNotFoundError,
          );
        });
        test("should resolve in parent container", () => {
          const childContainer = container.createChildContainer();
          container.register("test", { useValue: "test" });
          expect(container.resolveAsync("test")).resolves.toBe("test");
          expect(childContainer.resolveAsync("test")).resolves.toBe("test");
        });
        test("should resolve scoped", async () => {
          class Test {
            propertyA = "test";
          }
          container.register("test", Test, { lifetime: Lifetime.Scoped });
          const childContainer = container.createChildContainer();
          const scope = childContainer.createScope();
          expect(
            (await childContainer.resolveAsync<Test>("test", scope)).propertyA,
          ).toBe("test");
        });
        test("child container resolves even when parent doesn't have registration", () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          expect(
            childContainer.resolveAsync<Foo>("IFoo"),
          ).resolves.toBeInstanceOf(Foo);
        });
        test("child container resolves using parent's registration when child container doesn't have registration", () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          expect(
            childContainer.resolveAsync<Foo>("IFoo"),
          ).resolves.toBeInstanceOf(Foo);
        });
        test("child container resolves all even when parent doesn't have registration", async () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          const myFoo = await childContainer.resolveAllAsync<IFoo>("IFoo");
          expect(myFoo).toBeInstanceOf(Array);
          expect(myFoo).toHaveLength(1);
          expect(myFoo[0]).toBeInstanceOf(Foo);
        });

        test("child container resolves all using parent's registration when child container doesn't have registration", async () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          interface IFoo {}
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          const myFoo = await childContainer.resolveAllAsync<IFoo>("IFoo");
          expect(myFoo).toBeInstanceOf(Array);
          expect(myFoo).toHaveLength(1);
          expect(myFoo[0]).toBeInstanceOf(Foo);
        });
        test("should not create a new instance of requested singleton service", async () => {
          @Singleton()
          class Bar {}

          const bar1 = await container.resolveAsync(Bar);

          expect(bar1).toBeInstanceOf(Bar);

          const childContainer = container.createChildContainer();
          const bar2 = await childContainer.resolveAsync(Bar);

          expect(bar2).toBeInstanceOf(Bar);
          expect(bar1).toBe(bar2);
        });
      });
      describe("removeRegistration", () => {
        test("should remove registration", async () => {
          class Test {}
          container.register("test", Test, { lifetime: Lifetime.Singleton });
          container.register("test", Test, { lifetime: Lifetime.Transient });
          const instances = container.resolveAll("test");
          expect(instances).toBeInstanceOf(Array);
          expect(instances).toHaveLength(2);
          expect(instances[0]).toBeInstanceOf(Test);
          expect(instances[1]).toBeInstanceOf(Test);
          expect(instances[0]).not.toBe(instances[1]);
          await container.removeRegistration(
            "test",
            (reg) => reg.options.lifetime === Lifetime.Transient,
          );
          const instances2 = container.resolveAll("test");
          expect(instances2).toBeInstanceOf(Array);
          expect(instances2).toHaveLength(1);
          expect(instances2[0]).toBeInstanceOf(Test);
          expect(instances2[0]).toBe(instances[0]);
          await container.removeRegistration(
            "test",
            (reg) => reg.options.lifetime === Lifetime.Singleton,
          );
          expect(() => container.resolveAll("test")).toThrow(
            TokenNotFoundError,
          );
        });
      });
      describe("registerType", () => {
        test("registerType() allows for classes to be swapped", async () => {
          class Bar {}
          class Foo {}
          container.registerType(Bar, Foo);

          expect(container.resolveAsync(Bar)).resolves.toBeInstanceOf(Foo);
        });

        test("registerType() allows for names to be registered for a given type", () => {
          class Bar {}
          container.registerType("CoolName", Bar);

          expect(
            container.resolveAsync<Bar>("CoolName"),
          ).resolves.toBeInstanceOf(Bar);
        });
      });
    });
  });
});
