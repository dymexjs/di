import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../../src/di/container";
import {
  AutoInjectable,
  createInterfaceId,
  Inject,
  InjectAll,
  Scoped,
  Singleton,
  Transient,
} from "../../../src/di/decorators";
import { UndefinedScopeError } from "../../../src/di/exceptions/UndefinedScopeError";
import { InvalidDecoratorError } from "../../../src/di/exceptions/InvalidDecoratorError";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("sync", () => {
    describe("Class Decorators", () => {
      describe("Singleton", () => {
        test("should work with @Singleton decorator", () => {
          @Singleton()
          class TestClass {}
          const instance1 = container.resolve(TestClass);
          const instance2 = container.resolve(TestClass);
          expect(instance1).toBe(instance2);
        });
        test("should create an target and inject singleton", () => {
          @Singleton("serviceA")
          class ServiceA {}
          @Singleton(["serviceA"])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = container.resolve<ServiceB>(ServiceB);
          expect(b).toBeInstanceOf(ServiceB);
          expect(b.serviceA).toBeInstanceOf(ServiceA);
          const a = container.resolve<ServiceA>("serviceA");
          expect(a).toBeInstanceOf(ServiceA);
          expect(b.serviceA).toBe(a);
        });
        test("should redirect the registration", () => {
          @Singleton()
          class Test {}

          class TestMock {}

          @Transient([Test])
          class TestClass {
            constructor(public readonly test: Test) {}
          }
          container.registerType(Test, TestMock);
          const test = container.resolve<TestClass>(TestClass);
          expect(test.test).toBeInstanceOf(TestMock);
        });
      });
      describe("Transient", () => {
        test("should work with @Transient decorator", () => {
          @Transient()
          class TestClass {}
          const instance1 = container.resolve(TestClass);
          const instance2 = container.resolve(TestClass);
          expect(instance1).not.toBe(instance2);
        });
        test("should create an target and inject transient", () => {
          @Transient()
          class ServiceA {}
          @Singleton([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = container.resolve<ServiceB>(ServiceB);
          expect(b).toBeInstanceOf(ServiceB);
          expect(b.serviceA).toBeInstanceOf(ServiceA);
          const a = container.resolve<ServiceA>(ServiceA);
          expect(a).toBeInstanceOf(ServiceA);
          expect(b.serviceA).not.toBe(a);
          expect(b.serviceA).toEqual(a);
        });
        test("should create transients", () => {
          @Transient()
          class ServiceA {}
          @Transient([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = container.resolve<ServiceB>(ServiceB);
          expect(b).toBeInstanceOf(ServiceB);
          expect(b.serviceA).toBeInstanceOf(ServiceA);
          const a = container.resolve<ServiceA>(ServiceA);
          expect(a).toBeInstanceOf(ServiceA);
          expect(b.serviceA).not.toBe(a);
          expect(b.serviceA).toEqual(a);
          const b2 = container.resolve<ServiceB>(ServiceB);
          expect(b).not.toBe(b2);
          expect(b).toEqual(b2);
        });
      });
      describe("Scoped", () => {
        test("should work with @Scoped decorator", () => {
          @Scoped()
          class TestClass {}
          const scope = container.createScope();
          const instance1 = container.resolve(TestClass, scope);
          const instance2 = container.resolve(TestClass, scope);
          expect(instance1).toBe(instance2);
        });
        test("should create scoped", () => {
          @Scoped()
          class ServiceA {}
          @Scoped([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const scope = container.createScope();
          const b = container.resolve<ServiceB>(ServiceB, scope);
          expect(b).toBeInstanceOf(ServiceB);
          expect(b.serviceA).toBeInstanceOf(ServiceA);
          const a = container.resolve<ServiceA>(ServiceA, scope);
          expect(a).toBeInstanceOf(ServiceA);
          expect(b.serviceA).toBe(a);
          expect(() => container.resolve<ServiceB>(ServiceB)).toThrow(UndefinedScopeError);
        });
      });
      describe("AutoInjectable", () => {
        describe("new()", () => {
          test("@AutoInjectable allows for injection to be performed without using .resolveWithArgs()", async () => {
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              constructor(
                public otherArg: string,
                public a?: TestA,
              ) {}
            }
            const testB = new TestB("test");
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.otherArg).toBe("test");
            expect(testB.a).toBeInstanceOf(TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", () => {
            class Bar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(public myBar?: Bar) {}
            }

            const myBar = new Bar();
            const myFoo = new Foo(myBar);

            expect(myFoo.myBar).toBe(myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", () => {
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
            const myFoo = new Foo(myFooBar);

            expect(myFoo.myFooBar).toBe(myFooBar);
            expect(myFoo.myBar).toBeInstanceOf(Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", () => {
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

            const instance = new Child();

            expect(instance.myFoo).toBeInstanceOf(Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", () => {
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

            const instance = new Child();

            expect(instance.a).toBe(a);
            expect(instance.b).toBe(b);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", () => {
            class Foo {}
            @Transient([Foo])
            class Bar {
              constructor(public myFoo: Foo) {}
            }
            @AutoInjectable([Bar])
            class FooBar {
              constructor(public myBar?: Bar) {}
            }

            const myFooBar = new FooBar();

            expect(myFooBar.myBar!.myFoo).toBeInstanceOf(Foo);
          });
          test("@AutoInjectable works with @Singleton", () => {
            class Bar {}

            @Singleton([Bar])
            @AutoInjectable([Bar])
            class Foo {
              constructor(public bar: Bar) {}
            }

            const instance1 = container.resolve<Foo>(Foo);
            const instance2 = container.resolve<Foo>(Foo);

            expect(instance1).toBe(instance2);
            expect(instance1.bar).toBe(instance2.bar);
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
              constructor(public bar?: Bar[]) {}
            }

            const foo = new Foo();
            expect(Array.isArray(foo.bar)).toBeTruthy();
            expect(foo.bar!.length).toBe(1);
            expect(foo.bar![0]).toBeInstanceOf(FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", () => {
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              constructor(public foo?: Foo[]) {}
            }

            const bar = new Bar();
            expect(Array.isArray(bar.foo)).toBeTruthy();
            expect(bar.foo!.length).toBe(1);
            expect(bar.foo![0]).toBeInstanceOf(Foo);
          });
        });
        describe("resolveWithArgs", () => {
          test("should resolve an instance with extra args", () => {
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              constructor(
                public hello: string,
                public num: number,
                public a?: TestA,
              ) {}
            }
            const testB = container.resolveWithArgs<TestB>(TestB, ["test", 1]);
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.hello).toBe("test");
            expect(testB.num).toBe(1);
            expect(testB.a).toBeInstanceOf(TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", () => {
            class Bar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(public myBar?: Bar) {}
            }

            const myBar = new Bar();
            const myFoo = container.resolveWithArgs<Foo>(Foo, [myBar]);

            expect(myFoo.myBar).toBe(myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", () => {
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
            const myFoo = container.resolveWithArgs<Foo>(Foo, [myFooBar]);

            expect(myFoo.myFooBar).toBe(myFooBar);
            expect(myFoo.myBar).toBeInstanceOf(Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", () => {
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

            const instance = container.resolveWithArgs<Child>(Child);

            expect(instance.myFoo).toBeInstanceOf(Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", () => {
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

            const instance = container.resolveWithArgs<Child>(Child);
            //const instance = new Child();

            expect(instance.a).toBe(a);
            expect(instance.b).toBe(b);
            expect(instance.myFoo).toBeInstanceOf(Foo);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", () => {
            class Foo {}
            @Transient([Foo])
            class Bar {
              constructor(public myFoo: Foo) {}
            }
            @AutoInjectable([Bar])
            class FooBar {
              constructor(public myBar?: Bar) {}
            }

            const myFooBar = container.resolveWithArgs<FooBar>(FooBar);

            expect(myFooBar.myBar!.myFoo).toBeInstanceOf(Foo);
          });
          test("@AutoInjectable works with @Singleton", () => {
            class Bar {}

            @Singleton([Bar])
            @AutoInjectable([Bar])
            class Foo {
              constructor(public bar: Bar) {}
            }

            const instance1 = container.resolve<Foo>(Foo);
            const instance2 = container.resolve<Foo>(Foo);

            expect(instance1).toBe(instance2);
            expect(instance1.bar).toBe(instance2.bar);
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
              constructor(public bar?: Bar[]) {}
            }

            const foo = container.resolveWithArgs(Foo);
            expect(Array.isArray(foo.bar)).toBeTruthy();
            expect(foo.bar!.length).toBe(1);
            expect(foo.bar![0]).toBeInstanceOf(FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", () => {
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              constructor(public foo?: Foo[]) {}
            }

            const bar = container.resolveWithArgs(Bar);
            expect(Array.isArray(bar.foo)).toBeTruthy();
            expect(bar.foo!.length).toBe(1);
            expect(bar.foo![0]).toBeInstanceOf(Foo);
          });
        });
      });
      describe("Inject and InjectAll", () => {
        test("should fail", () => {
          expect(
            () =>
              class Test {
                @Inject("token")
                set val(value: unknown) {}
              },
          ).toThrow(InvalidDecoratorError);
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
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.testA).toBeInstanceOf(TestA);
            expect(testB.testA.prop).toBe("testA");
          });
          test("should injectAll registered instances into the class field", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              testA!: TestA[];
            }

            const testB = new TestB();
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.testA).toBeInstanceOf(Array);
            expect(testB.testA.length).toBe(2);
            expect(testB.testA[0]).toBeInstanceOf(TestA);
            expect(testB.testA[0].prop).toBe("testA");
            expect(testB.testA[1]).toBeInstanceOf(TestA);
            expect(testB.testA[1].prop).toBe("testA");
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
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.testA).toBeInstanceOf(TestA);
            expect(testB.testA.prop).toBe("testA");
          });
          test("should injectAll registered instances into the class accessor", () => {
            class TestA {
              prop = "testA";
            }

            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              accessor testA!: TestA[];
            }

            const testB = new TestB();
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.testA).toBeInstanceOf(Array);
            expect(testB.testA).toHaveLength(2);
            expect(testB.testA[0]).toBeInstanceOf(TestA);
            expect(testB.testA[0].prop).toBe("testA");
            expect(testB.testA[1]).toBeInstanceOf(TestA);
            expect(testB.testA[1].prop).toBe("testA");
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
                return testA!.prop;
              }
            }
            const testB = container.resolve(TestB);
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.doSomething()).toBe("testA");
          });

          test("should inject all registered instances into the method of the class", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              doSomething(testA?: TestA[]): Array<TestA> {
                return testA!;
              }
            }
            const testB = container.resolve(TestB);
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.doSomething()).toBeInstanceOf(Array);
            expect(testB.doSomething()).toHaveLength(2);
            expect(testB.doSomething()[0].prop).toBe("testA");
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
                return this.propTestA!;
              }
            }
            const testB = container.resolve(TestB);
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.propTestA).toBeUndefined();
            expect(testB.testA).toBeInstanceOf(TestA);
            expect(testB.testA.prop).toBe("testA");
          });
          test("should inject all registered instances into the getter of the class", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              propTestA?: TestA[];
              @InjectAll(TestA)
              get testA(): TestA[] {
                return this.propTestA!;
              }
            }
            const testB = container.resolve(TestB);
            expect(testB).toBeInstanceOf(TestB);
            expect(testB.propTestA).toBeUndefined();
            expect(testB.testA).toBeInstanceOf(Array);
            expect(testB.testA).toHaveLength(2);
            expect(testB.testA[0].prop).toBe("testA");
          });
        });
      });
      test("should create instance of object not in container", () => {
        class TestA {}
        @Singleton([TestA])
        class TestB {
          constructor(public a: TestA) {}
        }
        const test = container.resolve<TestB>(TestB);
        expect(test).toBeInstanceOf(TestB);
        expect(test.a).toBeInstanceOf(TestA);
      });
    });
    describe("Interface Decorators", () => {
      test("should create an target and inject singleton", () => {
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
        const b = container.resolve<SB>(SB);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
        const a = container.resolve<SA>(SA);
        expect(a).toBeInstanceOf(ServiceA);
        expect(b.serviceA).toBe(a);
      });
      test("should create an target and inject transient", () => {
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
        const b = container.resolve<SB>(SB);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
        const a = container.resolve<SA>(SA);
        expect(a).toBeInstanceOf(ServiceA);
        expect(b.serviceA).not.toBe(a);
        expect(b.serviceA).toEqual(a);
      });
      test("should create transients", () => {
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
        const b = container.resolve<SB>(SB);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
        const a = container.resolve<SA>(SA);
        expect(a).toBeInstanceOf(ServiceA);
        expect(b.serviceA).not.toBe(a);
        expect(b.serviceA).toEqual(a);
        const b2 = container.resolve<SB>(SB);
        expect(b).not.toBe(b2);
        expect(b).toEqual(b2);
      });
      test("should create scoped", () => {
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
        const b = container.resolve<SB>(SB, scope);
        expect(b).toBeInstanceOf(ServiceB);
        expect(b.serviceA).toBeInstanceOf(ServiceA);
        const a = container.resolve<SA>(SA, scope);
        expect(a).toBeInstanceOf(ServiceA);
        expect(b.serviceA).toBe(a);
        expect(b.serviceA).toEqual(a);
        expect(() => container.resolve<SB>(SB)).toThrow(UndefinedScopeError);
      });
    });
  });
});
