import { beforeEach, describe, test } from "node:test";
import * as assert from "node:assert/strict";
import {
  AutoInjectable,
  container,
  getInterfaceToken,
  Inject,
  InjectAll,
  InvalidDecoratorError,
  Scoped,
  Singleton,
  Transient,
  UndefinedScopeError,
} from "../../src/index.ts";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.dispose());
  describe("sync", () => {
    describe("Class Decorators", () => {
      describe("Singleton", () => {
        test("should work with @Singleton decorator", () => {
          @Singleton()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestClass {}
          const instance1 = container.resolve(TestClass);
          const instance2 = container.resolve(TestClass);
          assert.strictEqual(instance1, instance2);
        });
        test("should create an target and inject singleton", () => {
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
          const b = container.resolve<ServiceB>(ServiceB);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = container.resolve<ServiceA>("serviceA");
          assert.ok(a instanceof ServiceA);
          assert.strictEqual(b.serviceA, a);
        });
        test("should redirect the registration", () => {
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
          const test = container.resolve<TestClass>(TestClass);
          assert.ok(test.test instanceof TestMock);
        });
        test("register in another container", () => {
          const childContainer = container.createChildContainer();
          @Singleton(childContainer)
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class Test {}

          const resolveChildContainer = childContainer.resolve(Test);

          //Will automatically register the test class in parent container as a Transient
          const resolveParent = container.resolve(Test);
          assert.notStrictEqual(resolveChildContainer, resolveParent);
          assert.ok(resolveChildContainer instanceof Test);
          assert.ok(resolveParent instanceof Test);
        });
      });
      describe("Transient", () => {
        test("should work with @Transient decorator", () => {
          @Transient()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestClass {}
          const instance1 = container.resolve(TestClass);
          const instance2 = container.resolve(TestClass);
          assert.notStrictEqual(instance1, instance2);
        });
        test("should create an target and inject transient", () => {
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
          const b = container.resolve<ServiceB>(ServiceB);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = container.resolve<ServiceA>(ServiceA);
          assert.ok(a instanceof ServiceA);
          assert.notStrictEqual(b.serviceA, a);
          assert.deepStrictEqual(b.serviceA, a);
        });
        test("should create transients", () => {
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
          const b = container.resolve<ServiceB>(ServiceB);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = container.resolve<ServiceA>(ServiceA);
          assert.ok(a instanceof ServiceA);
          assert.notStrictEqual(b.serviceA, a);
          assert.deepStrictEqual(b.serviceA, a);
          const b2 = container.resolve<ServiceB>(ServiceB);
          assert.notStrictEqual(b, b2);
          assert.deepStrictEqual(b, b2);
        });
      });
      describe("Scoped", () => {
        test("should work with @Scoped decorator", () => {
          @Scoped()
          // eslint-disable-next-line @typescript-eslint/no-extraneous-class
          class TestClass {}
          const scope = container.createScope();
          const instance1 = scope.resolve(TestClass);
          const instance2 = scope.resolve(TestClass);
          assert.strictEqual(instance1, instance2);
        });
        test("should create scoped", () => {
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
          const b = scope.resolve<ServiceB>(ServiceB);
          assert.ok(b instanceof ServiceB);
          assert.ok(b.serviceA instanceof ServiceA);
          const a = scope.resolve<ServiceA>(ServiceA);
          assert.ok(a instanceof ServiceA);
          assert.strictEqual(b.serviceA, a);
          assert.throws(
            () => container.resolve<ServiceB>(ServiceB),
            UndefinedScopeError,
          );
        });
      });
      describe("AutoInjectable", () => {
        describe("new()", () => {
          test("@AutoInjectable allows for injection to be performed without using .resolveWithArgs()", async () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              public otherArg: string;
              public a?: TestA;

              constructor(otherArg: string, a?: TestA) {
                this.otherArg = otherArg;
                this.a = a;
              }
            }
            const testB = new TestB("test");
            assert.ok(testB instanceof TestB);
            assert.strictEqual(testB.otherArg, "test");
            assert.ok(testB.a instanceof TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", () => {
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
            const myFoo = new Foo(myBar);

            assert.strictEqual(myFoo.myBar, myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", () => {
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
            const myFoo = new Foo(myFooBar);

            assert.strictEqual(myFoo.myFooBar, myFooBar);
            assert.ok(myFoo.myBar instanceof Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", () => {
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

            const instance = new Child();

            assert.ok(instance.myFoo instanceof Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", () => {
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

            const instance = new Child();

            assert.strictEqual(instance.a, a);
            assert.strictEqual(instance.b, b);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", () => {
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

            const myFooBar = new FooBar();

            assert.ok(myFooBar.myBar?.myFoo instanceof Foo);
          });
          /*test("@AutoInjectable works with @Singleton", () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Bar {}

            @Singleton([Bar])
            @AutoInjectable([Bar])
            class Foo {
              public bar?: Bar;
              constructor(bar?: Bar) {
                this.bar = bar;
              }
            }

            const instance1 = container.resolve<Foo>(Foo);
            const instance2 = new Foo();

            assert.strictEqual(instance1, instance2);
            assert.strictEqual(instance1.bar, instance2.bar);
          });*/

          test("@AutoInjectable resolves multiple registered dependencies", () => {
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

            const foo = new Foo();
            assert.ok(Array.isArray(foo.bar));
            assert.strictEqual(foo.bar?.length, 1);
            assert.ok(foo.bar[0] instanceof FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              public foo?: Array<Foo>;
              constructor(foo?: Array<Foo>) {
                this.foo = foo;
              }
            }

            const bar = new Bar();
            assert.ok(Array.isArray(bar.foo));
            assert.strictEqual(bar.foo?.length, 1);
            assert.ok(bar.foo[0] instanceof Foo);
          });
        });
        describe("resolveWithArgs", () => {
          test("should resolve an instance with extra args", () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              public hello: string;
              public num: number;
              public a?: TestA;

              constructor(hello: string, num: number, a?: TestA) {
                this.hello = hello;
                this.num = num;
                this.a = a;
              }
            }
            const testB = container.resolveWithArgs<TestB>(TestB, ["test", 1]);
            assert.ok(testB instanceof TestB);
            assert.strictEqual(testB.hello, "test");
            assert.strictEqual(testB.num, 1);
            assert.ok(testB.a instanceof TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", () => {
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
            const myFoo = container.resolveWithArgs<Foo>(Foo, [myBar]);

            assert.strictEqual(myFoo.myBar, myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", () => {
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
            const myFoo = container.resolveWithArgs<Foo>(Foo, [myFooBar]);

            assert.strictEqual(myFoo.myFooBar, myFooBar);
            assert.ok(myFoo.myBar instanceof Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", () => {
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

            const instance = container.resolveWithArgs<Child>(Child);

            assert.ok(instance.myFoo instanceof Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", () => {
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

            const instance = container.resolveWithArgs<Child>(Child);
            //const instance = new Child();

            assert.strictEqual(instance.a, a);
            assert.strictEqual(instance.b, b);
            assert.ok(instance.myFoo instanceof Foo);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", () => {
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

            const myFooBar = container.resolveWithArgs<FooBar>(FooBar);

            assert.ok(myFooBar.myBar?.myFoo instanceof Foo);
          });
          test("@AutoInjectable works with @Singleton", () => {
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

            const instance1 = container.resolve<Foo>(Foo);
            const instance2 = container.resolve<Foo>(Foo);

            assert.strictEqual(instance1, instance2);
            assert.strictEqual(instance1.bar, instance2.bar);
          });
          test("@AutoInjectable resolves multiple registered dependencies", () => {
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

            const foo = container.resolveWithArgs(Foo);
            assert.ok(Array.isArray(foo.bar));
            assert.strictEqual(foo.bar?.length, 1);
            assert.ok(foo.bar[0] instanceof FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              public foo?: Array<Foo>;
              constructor(foo?: Array<Foo>) {
                this.foo = foo;
              }
            }

            const bar = container.resolveWithArgs(Bar);
            assert.ok(Array.isArray(bar.foo));
            assert.strictEqual(bar.foo?.length, 1);
            assert.ok(bar.foo[0] instanceof Foo);
          });
        });
      });
      describe("Inject and InjectAll", () => {
        test("should fail", () => {
          assert.throws(
            () =>
              class Test {
                @Inject("token")
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                set val(value: unknown) {}
              },
            InvalidDecoratorError,
          );
        });
        describe("field", () => {
          test("should inject an instance into the class field", () => {
            @Singleton()
            class TestA {
              prop = "testA";
            }

            class TestB {
              @Inject(TestA)
              testA!: TestA;
            }
            const testB = new TestB();
            assert.ok(testB instanceof TestB);
            assert.ok(testB.testA instanceof TestA);
            assert.strictEqual(testB.testA.prop, "testA");
          });
          test("should injectAll registered instances into the class field", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              testA!: Array<TestA>;
            }

            const testB = new TestB();
            assert.ok(testB instanceof TestB);
            assert.ok(testB.testA instanceof Array);
            assert.strictEqual(testB.testA.length, 2);
            assert.ok(testB.testA[0] instanceof TestA);
            assert.strictEqual(testB.testA[0].prop, "testA");
            assert.ok(testB.testA[1] instanceof TestA);
            assert.strictEqual(testB.testA[1].prop, "testA");
          });
        });
        describe("accessor", () => {
          test("should inject an instance into the class accessor", () => {
            @Singleton()
            class TestA {
              prop = "testA";
            }

            class TestB {
              @Inject(TestA)
              accessor testA!: TestA;
            }
            const testB = new TestB();
            assert.ok(testB instanceof TestB);
            assert.ok(testB.testA instanceof TestA);
            assert.strictEqual(testB.testA.prop, "testA");
          });
          test("should injectAll registered instances into the class accessor", () => {
            class TestA {
              prop = "testA";
            }

            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              accessor testA!: Array<TestA>;
            }

            const testB = new TestB();
            assert.ok(testB instanceof TestB);
            assert.ok(testB.testA instanceof Array);
            assert.strictEqual(testB.testA.length, 2);
            assert.ok(testB.testA[0] instanceof TestA);
            assert.strictEqual(testB.testA[0].prop, "testA");
            assert.ok(testB.testA[1] instanceof TestA);
            assert.strictEqual(testB.testA[1].prop, "testA");
          });
        });
        describe("method", () => {
          test("should inject an instance into the method of the class", () => {
            @Singleton()
            class TestA {
              prop = "testA";
            }
            class TestB {
              @Inject(TestA)
              doSomething(testA?: TestA) {
                return testA?.prop;
              }
            }
            const testB = container.resolve(TestB);
            assert.ok(testB instanceof TestB);
            assert.strictEqual(testB.doSomething(), "testA");
          });

          test("should inject all registered instances into the method of the class", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              doSomething(testA?: Array<TestA>): Array<TestA> {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return testA!;
              }
            }
            const testB = container.resolve(TestB);
            assert.ok(testB instanceof TestB);
            assert.ok(testB.doSomething() instanceof Array);
            assert.strictEqual(testB.doSomething().length, 2);
            assert.strictEqual(testB.doSomething()[0].prop, "testA");
          });
        });
        describe("getter", () => {
          test("should inject an instance into the getter of the class", () => {
            @Singleton()
            class TestA {
              prop = "testA";
            }
            class TestB {
              propTestA?: TestA;
              @Inject(TestA)
              get testA(): TestA {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return this.propTestA!;
              }
            }
            const testB = container.resolve(TestB);
            assert.ok(testB instanceof TestB);
            assert.strictEqual(testB.propTestA, undefined);
            assert.ok(testB.testA instanceof TestA);
            assert.strictEqual(testB.testA.prop, "testA");
          });
          test("should inject all registered instances into the getter of the class", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              propTestA?: Array<TestA>;
              @InjectAll(TestA)
              get testA(): Array<TestA> {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return this.propTestA!;
              }
            }
            const testB = container.resolve(TestB);
            assert.ok(testB instanceof TestB);
            assert.strictEqual(testB.propTestA, undefined);
            assert.ok(testB.testA instanceof Array);
            assert.strictEqual(testB.testA.length, 2);
            assert.strictEqual(testB.testA[0].prop, "testA");
          });
        });
      });
      test("should create instance of object not in container", () => {
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class TestA {}
        @Singleton([TestA])
        class TestB {
          public a: TestA;
          constructor(a: TestA) {
            this.a = a;
          }
        }
        const test = container.resolve<TestB>(TestB);
        assert.ok(test instanceof TestB);
        assert.ok(test.a instanceof TestA);
      });
    });
    describe("Interface Decorators", () => {
      test("should create an target and inject singleton", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");

        @Singleton(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA implements SA {}
        @Singleton(SB, [SA])
        class ServiceB implements SB {
          public serviceA: SA;
          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
        }
        const b = container.resolve<SB>(SB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = container.resolve<SA>(SA);
        assert.ok(a instanceof ServiceA);
        assert.strictEqual(b.serviceA, a);
      });
      test("should create an target and inject transient", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");

        @Transient(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA implements SA {}
        @Singleton(SB, [SA])
        class ServiceB implements SB {
          public serviceA: SA;
          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
        }
        const b = container.resolve<SB>(SB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = container.resolve<SA>(SA);
        assert.ok(a instanceof ServiceA);
        assert.notStrictEqual(b.serviceA, a);
        assert.deepStrictEqual(b.serviceA, a);
      });
      test("should create transients", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");
        @Transient(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA implements SA {}
        @Transient(SB, [SA])
        class ServiceB implements SB {
          public serviceA: SA;
          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
        }
        const b = container.resolve<SB>(SB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = container.resolve<SA>(SA);
        assert.ok(a instanceof ServiceA);
        assert.notStrictEqual(b.serviceA, a);
        assert.deepStrictEqual(b.serviceA, a);
        const b2 = container.resolve<SB>(SB);
        assert.notStrictEqual(b, b2);
        assert.deepStrictEqual(b, b2);
      });
      test("should create scoped", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");
        @Scoped(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA implements SA {}
        @Scoped(SB, [SA])
        class ServiceB implements SB {
          public serviceA: SA;
          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
        }
        const scope = container.createScope();
        const b = scope.resolve<SB>(SB);
        assert.ok(b instanceof ServiceB);
        assert.ok(b.serviceA instanceof ServiceA);
        const a = scope.resolve<SA>(SA);
        assert.ok(a instanceof ServiceA);
        assert.strictEqual(b.serviceA, a);
        assert.equal(b.serviceA, a);
        assert.throws(() => container.resolve<SB>(SB), UndefinedScopeError);
      });
      test("should create diferent keyed singletons", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface SA {}
        const SA = getInterfaceToken("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = getInterfaceToken("SB");

        //@Singleton(SA)
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class ServiceA implements SA {}
        //@Singleton(SB, [SA])
        class ServiceB implements SB {
          public serviceA: SA;
          constructor(serviceA: SA) {
            this.serviceA = serviceA;
          }
        }
        container.registerSingleton("sa1", ServiceA);
        container.registerSingleton("sa2", ServiceA);
        container.registerSingleton("sb1", ServiceB, ["sa1"]);
        container.registerSingleton("sb2", ServiceB, ["sa2"]);
        const a1 = container.resolve<SA>("sa1");
        const a2 = container.resolve<SA>("sa2");
        assert.ok(a1 instanceof ServiceA);
        assert.ok(a2 instanceof ServiceA);
        assert.notStrictEqual(a1, a2);
        const b1 = container.resolve<SB>("sb1");
        const b2 = container.resolve<SB>("sb2");
        assert.ok(b1 instanceof ServiceB);
        assert.ok(b2 instanceof ServiceB);
        assert.notStrictEqual(b1, b2);
        assert.notStrictEqual(b1.serviceA, b2.serviceA);
        assert.strictEqual(b1.serviceA, a1);
        assert.strictEqual(b2.serviceA, a2);
      });
    });
  });
});
