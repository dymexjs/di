import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../src/container";
import {
  AutoInjectable,
  createInterfaceId,
  Scoped,
  Singleton,
  Transient,
} from "../../src/decorators";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("Class Decorators", () => {
      describe("Singleton", () => {
        test("should work with @Singleton decorator", async () => {
          @Singleton()
          class TestClass {}
          const instance1 = await container.resolveAsync(TestClass);
          const instance2 = await container.resolveAsync(TestClass);
          expect(instance1).toBe(instance2);
        });
        test("should create an target and inject singleton", async () => {
          @Singleton("serviceA")
          class ServiceA {}
          @Singleton(["serviceA"])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync(ServiceB);
          expect(b).toBeInstanceOf(ServiceB);
          expect(b.serviceA).toBeInstanceOf(ServiceA);
          const a = await container.resolveAsync("serviceA");
          expect(a).toBeInstanceOf(ServiceA);
          expect(b.serviceA).toBe(a);
        });
        test("should redirect the registration", async () => {
          @Singleton()
          class Test {}

          class TestMock {}

          @Transient([Test])
          class TestClass {
            constructor(public readonly test: Test) {}
          }
          container.registerType(Test, TestMock);
          const test = await container.resolveAsync(TestClass);
          expect(test.test).toBeInstanceOf(TestMock);
        });
      });
      describe("Transient", () => {
        test("should work with @Transient decorator", async () => {
          @Transient()
          class TestClass {}
          const instance1 = await container.resolveAsync(TestClass);
          const instance2 = await container.resolveAsync(TestClass);
          expect(instance1).not.toBe(instance2);
        });
        test("should create an target and inject transient", async () => {
          @Transient()
          class ServiceA {}
          @Singleton([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync(ServiceB);
          expect(b).toBeInstanceOf(ServiceB);
          expect(b.serviceA).toBeInstanceOf(ServiceA);
          const a = await container.resolveAsync(ServiceA);
          expect(a).toBeInstanceOf(ServiceA);
          expect(b.serviceA).not.toBe(a);
          expect(b.serviceA).toEqual(a);
        });
        test("should create transients", async () => {
          @Transient()
          class ServiceA {}
          @Transient([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync(ServiceB);
          expect(b).toBeInstanceOf(ServiceB);
          expect(b.serviceA).toBeInstanceOf(ServiceA);
          const a = await container.resolveAsync(ServiceA);
          expect(a).toBeInstanceOf(ServiceA);
          expect(b.serviceA).not.toBe(a);
          expect(b.serviceA).toEqual(a);
          const b2 = await container.resolveAsync(ServiceB);
          expect(b).not.toBe(b2);
          expect(b).toEqual(b2);
        });
      });
      describe("Scoped", () => {
        test("should work with @Scoped decorator", async () => {
          @Scoped()
          class TestClass {}
          const scope = container.createScope();
          const instance1 = await container.resolveAsync(TestClass, scope);
          const instance2 = await container.resolveAsync(TestClass, scope);
          expect(instance1).toBe(instance2);
        });
        test("should create scoped", async () => {
          @Scoped()
          class ServiceA {}
          @Scoped([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const scope = container.createScope();
          const b = await container.resolveAsync(ServiceB, scope);
          expect(b).toBeInstanceOf(ServiceB);
          expect(b.serviceA).toBeInstanceOf(ServiceA);
          const a = await container.resolveAsync(ServiceA, scope);
          expect(a).toBeInstanceOf(ServiceA);
          expect(b.serviceA).toBe(a);
          expect(container.resolveAsync<ServiceB>(ServiceB)).rejects.toThrow(
            UndefinedScopeError,
          );
        });
      });
      describe("AutoInjectable", () => {
        describe("resolveWithArgs", () => {
          test("should resolve an instance with extra args", async () => {
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              constructor(
                public hello: string,
                public num: number,
                public a?: TestA,
              ) {}
            }
            const testB = await container.resolveWithArgsAsync(TestB, [
              "test",
              1,
            ]);
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.hello).toBe("test");
            expect(testB.num).toBe(1);
            expect(testB.a).toBeInstanceOf(TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", async () => {
            class Bar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(public myBar?: Bar) {}
            }

            const myBar = new Bar();
            const myFoo = await container.resolveWithArgsAsync(Foo, [myBar]);

            expect(myFoo.myBar).toBe(myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", async () => {
            class Bar {}
            class FooBar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(
                public myFooBar: FooBar,
                public myBar?: Bar,
              ) {}
            }

            const myFooBar = new FooBar();
            const myFoo = await container.resolveWithArgsAsync(Foo, [myFooBar]);

            expect(myFoo.myFooBar).toBe(myFooBar);
            expect(myFoo.myBar).toBeInstanceOf(Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", async () => {
            class Foo {
              constructor() {}
            }

            @AutoInjectable([Foo])
            class Ancestor {
              constructor(public myFoo?: Foo) {}
            }

            class Child extends Ancestor {
              constructor() {
                super();
              }
            }

            const instance = await container.resolveWithArgsAsync(Child);

            expect(instance.myFoo).toBeInstanceOf(Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", async () => {
            const a = 5;
            const b = 4;
            class Foo {
              constructor() {}
            }

            @AutoInjectable([Foo])
            class Ancestor {
              public a: number;
              constructor(public myFoo?: Foo) {
                this.a = a;
              }
            }

            class Child extends Ancestor {
              public b: number;
              constructor() {
                super();

                this.b = b;
              }
            }

            const instance = await container.resolveWithArgsAsync(Child);

            expect(instance.a).toBe(a);
            expect(instance.b).toBe(b);
            expect(instance.myFoo).toBeInstanceOf(Foo);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", async () => {
            class Foo {}
            @Transient([Foo])
            class Bar {
              constructor(public myFoo: Foo) {}
            }
            @AutoInjectable([Bar])
            class FooBar {
              constructor(public myBar?: Bar) {}
            }

            const myFooBar = await container.resolveWithArgsAsync(FooBar);

            expect(myFooBar.myBar!.myFoo).toBeInstanceOf(Foo);
          });
          test("@AutoInjectable works with @Singleton", async () => {
            class Bar {}

            @Singleton([Bar])
            @AutoInjectable([Bar])
            class Foo {
              constructor(public bar: Bar) {}
            }

            const instance1 = await container.resolveAsync(Foo);
            const instance2 = await container.resolveAsync(Foo);

            expect(instance1).toBe(instance2);
            expect(instance1.bar).toBe(instance2.bar);
          });
          test("@AutoInjectable resolves multiple registered dependencies", async () => {
            interface Bar {
              str: string;
            }

            @Transient()
            class FooBar implements Bar {
              str = "";
            }

            container.register<Bar>("Bar", { useClass: FooBar });

            @AutoInjectable(["Bar"], { all: ["Bar"] })
            class Foo {
              constructor(public bar?: Bar[]) {}
            }

            const foo = await container.resolveWithArgsAsync(Foo);
            expect(Array.isArray(foo.bar)).toBeTruthy();
            expect(foo.bar!.length).toBe(1);
            expect(foo.bar![0]).toBeInstanceOf(FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", async () => {
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              constructor(public foo?: Foo[]) {}
            }

            const bar = await container.resolveWithArgsAsync(Bar);
            expect(Array.isArray(bar.foo)).toBeTruthy();
            expect(bar.foo!.length).toBe(1);
            expect(bar.foo![0]).toBeInstanceOf(Foo);
          });
        });
      });
      test("should create instance of object not in container", async () => {
        class TestA {}
        @Singleton([TestA])
        class TestB {
          constructor(public a: TestA) {}
        }
        const test = await container.resolveAsync(TestB);
        expect(test).toBeInstanceOf(TestB);
        expect(test.a).toBeInstanceOf(TestA);
      });
    });
    describe("Interface Decorators", () => {
      test("should create an target and inject singleton", async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = createInterfaceId<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = createInterfaceId<SB>("SB");

        @Singleton(SA)
        class ServiceA {}
        @Singleton(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        expect(a).toBeInstanceOf(ServiceA);
        expect(b.serviceA).toBe(a);
      });
      test("should create an target and inject transient", async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = createInterfaceId<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = createInterfaceId<SB>("SB");

        @Transient(SA)
        class ServiceA {}
        @Singleton(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        expect(a).toBeInstanceOf(ServiceA);
        expect(b.serviceA).not.toBe(a);
        expect(b.serviceA).toEqual(a);
      });
      test("should create transients", async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = createInterfaceId<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = createInterfaceId<SB>("SB");
        @Transient(SA)
        class ServiceA {}
        @Transient(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        expect(a).toBeInstanceOf(ServiceA);
        expect(b.serviceA).not.toBe(a);
        expect(b.serviceA).toEqual(a);
        const b2 = await container.resolveAsync<SB>(SB);
        expect(b).not.toBe(b2);
        expect(b).toEqual(b2);
      });
      test("should create scoped", async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = createInterfaceId<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = createInterfaceId<SB>("SB");
        @Scoped(SA)
        class ServiceA {}
        @Scoped(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const scope = container.createScope();
        const b = await container.resolveAsync<SB>(SB, scope);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
        const a = await container.resolveAsync<SA>(SA, scope);
        expect(a).toBeInstanceOf(ServiceA);
        expect(b.serviceA).toBe(a);
        expect(b.serviceA).toEqual(a);
        expect(container.resolveAsync<SB>(SB)).rejects.toThrow(
          UndefinedScopeError,
        );
      });
    });
  });
});
