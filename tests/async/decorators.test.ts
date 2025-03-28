/* eslint-disable sonarjs/no-nested-functions */
import * as assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  AutoInjectable,
  container,
  getInterfaceToken,
  Scoped,
  Singleton,
  Transient,
  UndefinedScopeError,
} from "../../src/index.ts";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.dispose());
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
            public serviceA: ServiceA;

            constructor(serviceA: ServiceA) {
              this.serviceA = serviceA;
            }
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
            public readonly test: Test;

            constructor(test: Test) {
              this.test = test;
            }
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
            public serviceA: ServiceA;

            constructor(serviceA: ServiceA) {
              this.serviceA = serviceA;
            }
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
            public serviceA: ServiceA;

            constructor(serviceA: ServiceA) {
              this.serviceA = serviceA;
            }
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
          const instance1 = await scope.resolveAsync(TestClass);
          const instance2 = await scope.resolveAsync(TestClass);
          assert.strictEqual(instance1, instance2);
        });
        test("should create scoped", async () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class ServiceA {}
          @Scoped([ServiceA])
          class ServiceB {
            public serviceA: ServiceA;

            constructor(serviceA: ServiceA) {
              this.serviceA = serviceA;
            }
          }
          const scope = container.createScope();
          const b = await scope.resolveAsync(ServiceB);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = await scope.resolveAsync(ServiceA);
          assert.ok(a instanceof ServiceA);
          assert.strictEqual(b.serviceA, a);
          assert.rejects(
            container.resolveAsync<ServiceB>(ServiceB),
            UndefinedScopeError,
          );
        });
      });
      describe("AutoInjectable", () => {
        describe("resolveWithArgs", () => {
          test("should resolve an instance with extra args", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              public hello: string;
              public num: number;
              public a?: TestA;

              constructor(hello: string, number_: number, a?: TestA) {
                this.hello = hello;
                this.num = number_;
                this.a = a;
              }
            }
            const testB = await container.resolveWithArgsAsync(TestB, [
              "test",
              1,
            ]);
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
              public myBar?: Bar;

              constructor(myBar?: Bar) {
                this.myBar = myBar;
              }
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
              public myFooBar: FooBar;
              public myBar?: Bar;

              constructor(myFooBar: FooBar, myBar?: Bar) {
                this.myFooBar = myFooBar;
                this.myBar = myBar;
              }
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
              public myFoo?: Foo;

              constructor(myFoo?: Foo) {
                this.myFoo = myFoo;
              }
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
              public myFoo?: Foo;

              constructor(myFoo?: Foo) {
                this.myFoo = myFoo;
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
              public myFoo: Foo;

              constructor(myFoo: Foo) {
                this.myFoo = myFoo;
              }
            }
            @AutoInjectable([Bar])
            class FooBar {
              public myBar?: Bar;

              constructor(myBar?: Bar) {
                this.myBar = myBar;
              }
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
              public bar: Bar;

              constructor(bar: Bar) {
                this.bar = bar;
              }
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
              public bar?: Array<Bar>;

              constructor(bar?: Array<Bar>) {
                this.bar = bar;
              }
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
              public foo?: Array<Foo>;

              constructor(foo?: Array<Foo>) {
                this.foo = foo;
              }
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
          public a: TestA;

          constructor(a: TestA) {
            this.a = a;
          }
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
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");

        @Singleton(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Singleton(SB, [SA])
        class ServiceB {
          public serviceA: SA;

          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
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
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");

        @Transient(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Singleton(SB, [SA])
        class ServiceB {
          public serviceA: SA;

          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
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
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");
        @Transient(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Transient(SB, [SA])
        class ServiceB {
          public serviceA: SA;

          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
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
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");
        @Scoped(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA {}
        @Scoped(SB, [SA])
        class ServiceB {
          public serviceA: SA;

          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
        }
        const scope = container.createScope();
        const b = await scope.resolveAsync<SB>(SB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = await scope.resolveAsync<SA>(SA);
        assert.ok(a instanceof ServiceA);
        assert.strictEqual(b.serviceA, a);
        assert.deepStrictEqual(b.serviceA, a);
        assert.rejects(container.resolveAsync<SB>(SB), UndefinedScopeError);
      });
    });
  });
});
