import { beforeEach, describe, test } from "node:test";
import { container } from "../../src/container";
import { AutoInjectable, getInterfaceToken, Scoped, Singleton, Transient } from "../../src/decorators";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError";
import * as assert from "node:assert/strict";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("Class Decorators", () => {
      describe("Singleton", () => {
        test("should work with @Singleton decorator", async () => {
          @Singleton()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestClass {}
          const instance1 = await container.resolveAsync(TestClass);
          const instance2 = await container.resolveAsync(TestClass);
          assert.strictEqual(instance1, instance2);
        });
        test("should create an target and inject singleton", async () => {
          @Singleton("serviceA")
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class ServiceA {}
          @Singleton(["serviceA"])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync(ServiceB);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = await container.resolveAsync("serviceA");
          assert.ok(a instanceof ServiceA);
          assert.strictEqual(b.serviceA, a);
        });
        test("should redirect the registration", async () => {
          @Singleton()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}

          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestMock {}

          @Transient([Test])
          class TestClass {
            constructor(public readonly test: Test) {}
          }
          container.registerType(Test, TestMock);
          const test = await container.resolveAsync(TestClass);
          assert.ok(test.test instanceof TestMock);
        });
      });
      describe("Transient", () => {
        test("should work with @Transient decorator", async () => {
          @Transient()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestClass {}
          const instance1 = await container.resolveAsync(TestClass);
          const instance2 = await container.resolveAsync(TestClass);
          assert.notStrictEqual(instance1, instance2);
        });
        test("should create an target and inject transient", async () => {
          @Transient()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class ServiceA {}
          @Singleton([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync(ServiceB);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = await container.resolveAsync(ServiceA);
          assert.ok(a instanceof ServiceA);
          assert.notStrictEqual(b.serviceA, a);
          assert.deepStrictEqual(b.serviceA, a);
        });
        test("should create transients", async () => {
          @Transient()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class ServiceA {}
          @Transient([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync(ServiceB);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = await container.resolveAsync(ServiceA);
          assert.ok(a instanceof ServiceA);
          assert.notStrictEqual(b.serviceA, a);
          assert.deepStrictEqual(b.serviceA, a);
          const b2 = await container.resolveAsync(ServiceB);
          assert.notStrictEqual(b, b2);
          assert.deepStrictEqual(b, b2);
        });
      });
      describe("Scoped", () => {
        test("should work with @Scoped decorator", async () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestClass {}
          const scope = container.createScope();
          const instance1 = await container.resolveAsync(TestClass, scope);
          const instance2 = await container.resolveAsync(TestClass, scope);
          assert.strictEqual(instance1, instance2);
        });
        test("should create scoped", async () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class ServiceA {}
          @Scoped([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const scope = container.createScope();
          const b = await container.resolveAsync(ServiceB, scope);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = await container.resolveAsync(ServiceA, scope);
          assert.ok(a instanceof ServiceA);
          assert.strictEqual(b.serviceA, a);
          assert.rejects(container.resolveAsync<ServiceB>(ServiceB), UndefinedScopeError);
        });
      });
      describe("AutoInjectable", () => {
        describe("resolveWithArgs", () => {
          test("should resolve an instance with extra args", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              constructor(
                public hello: string,
                public num: number,
                public a?: TestA,
              ) {}
            }
            const testB = await container.resolveWithArgsAsync(TestB, ["test", 1]);
            assert.ok(testB instanceof TestB);
            assert.strictEqual(testB.hello, "test");
            assert.strictEqual(testB.num, 1);
            assert.ok(testB.a instanceof TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Bar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(public myBar?: Bar) {}
            }

            const myBar = new Bar();
            const myFoo = await container.resolveWithArgsAsync(Foo, [myBar]);

            assert.strictEqual(myFoo.myBar, myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Bar {}
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
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

            assert.strictEqual(myFoo.myFooBar, myFooBar);
            assert.ok(myFoo.myBar instanceof Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Foo {
              // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
              constructor() {}
            }

            @AutoInjectable([Foo])
            class Ancestor {
              constructor(public myFoo?: Foo) {}
            }

            class Child extends Ancestor {
              // eslint-disable-next-line @typescript-eslint/no-useless-constructor
              constructor() {
                super();
              }
            }

            const instance = await container.resolveWithArgsAsync(Child);

            assert.ok(instance.myFoo instanceof Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", async () => {
            const a = 5;
            const b = 4;
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Foo {
              // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
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

            assert.strictEqual(instance.a, a);
            assert.strictEqual(instance.b, b);
            assert.ok(instance.myFoo instanceof Foo);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
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

            assert.ok(myFooBar.myBar?.myFoo instanceof Foo);
          });
          test("@AutoInjectable works with @Singleton", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Bar {}

            @Singleton([Bar])
            @AutoInjectable([Bar])
            class Foo {
              constructor(public bar: Bar) {}
            }

            const instance1 = await container.resolveAsync(Foo);
            const instance2 = await container.resolveAsync(Foo);

            assert.strictEqual(instance1, instance2);
            assert.strictEqual(instance1.bar, instance2.bar);
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
              constructor(public bar?: Array<Bar>) {}
            }

            const foo = await container.resolveWithArgsAsync(Foo);
            assert.ok(Array.isArray(foo.bar));
            assert.strictEqual(foo.bar?.length, 1);
            assert.ok(foo.bar[0] instanceof FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              constructor(public foo?: Array<Foo>) {}
            }

            const bar = await container.resolveWithArgsAsync(Bar);
            assert.ok(Array.isArray(bar.foo));
            assert.strictEqual(bar.foo?.length, 1);
            assert.ok(bar.foo[0] instanceof Foo);
          });
        });
      });
      test("should create instance of object not in container", async () => {
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class TestA {}
        @Singleton([TestA])
        class TestB {
          constructor(public a: TestA) {}
        }
        const test = await container.resolveAsync(TestB);
        assert.ok(test instanceof TestB);
        assert.ok(test.a instanceof TestA);
      });
    });
    describe("Interface Decorators", () => {
      test("should create an target and inject singleton", async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken<SB>("SB");

        @Singleton(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Singleton(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        assert.ok(a instanceof ServiceA);
        assert.strictEqual(b.serviceA, a);
      });
      test("should create an target and inject transient", async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken<SB>("SB");

        @Transient(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Singleton(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        assert.ok(a instanceof ServiceA);
        assert.notStrictEqual(b.serviceA, a);
        assert.deepStrictEqual(b.serviceA, a);
      });
      test("should create transients", async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken<SB>("SB");
        @Transient(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Transient(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        assert.ok(a instanceof ServiceA);
        assert.notStrictEqual(b.serviceA, a);
        assert.deepStrictEqual(b.serviceA, a);
        const b2 = await container.resolveAsync<SB>(SB);
        assert.notStrictEqual(b, b2);
        assert.deepStrictEqual(b, b2);
      });
      test("should create scoped", async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken<SB>("SB");
        @Scoped(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Scoped(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const scope = container.createScope();
        const b = await container.resolveAsync<SB>(SB, scope);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = await container.resolveAsync<SA>(SA, scope);
        assert.ok(a instanceof ServiceA);
        assert.strictEqual(b.serviceA, a);
        assert.deepStrictEqual(b.serviceA, a);
        assert.rejects(container.resolveAsync<SB>(SB), UndefinedScopeError);
      });
    });
  });
});
