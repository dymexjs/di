import { beforeEach, describe, test } from "node:test";
import { container } from "../../src/container";
import { StaticInjectable } from "../../src/types/static-inject.interface";
import {
  STATIC_INJECTIONS,
  STATIC_INJECTION_LIFETIME,
} from "../../src/constants";
import { Lifetime } from "../../src/types/registration.interface";
import { IContainer } from "../../src/types/container.interface";
import { createInterfaceId, Singleton, Transient } from "../../src/decorators";
import * as assert from "node:assert";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => container.reset());
  describe("async", () => {
    describe("Static inject", () => {
      class ServiceA implements StaticInjectable<typeof ServiceA> {
        constructor(
          public serviceB: ServiceB,
          public serviceC: ServiceC,
        ) {}
        public static [STATIC_INJECTIONS] = ["serviceB", "serviceC"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceB implements StaticInjectable<typeof ServiceB> {
        constructor(
          public serviceA: ServiceA,
          public serviceD: ServiceD,
        ) {}
        public static [STATIC_INJECTIONS] = ["serviceA", "serviceD"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceC implements StaticInjectable<typeof ServiceC> {
        constructor(
          public serviceB: ServiceB,
          public serviceD: ServiceD,
        ) {}
        public static [STATIC_INJECTIONS] = ["serviceB", "serviceD"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceD implements StaticInjectable<typeof ServiceD> {
        constructor(
          public serviceA: ServiceA,
          public serviceC: ServiceC,
        ) {}
        public static [STATIC_INJECTIONS] = ["serviceA", "serviceC"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }

      test("circular dependency resolution simple case", () => {
        const factoryTest = (cont: IContainer) => {
          return cont.resolve(TestClass);
        };
        const factoryTest2 = (cont: IContainer) => {
          return cont.resolve(TestClass2);
        };
        class TestClass2 implements StaticInjectable<typeof TestClass2> {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["factoryTest"];
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        class TestClass implements StaticInjectable<typeof TestClass> {
          public propertyA = "test";
          constructor(public test2: TestClass2) {}
          public static [STATIC_INJECTIONS] = ["factoryTest2"];
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        container.register("factoryTest", { useFactory: factoryTest });
        container.register("factoryTest2", { useFactory: factoryTest2 });
        const test2 = container.resolve(TestClass2);
        const test = container.resolve(TestClass);
        assert.ok(test2 instanceof TestClass2);
        assert.ok(test instanceof TestClass);
        assert.ok(test2.test instanceof TestClass);
        const t = test.test2.test;
        assert.ok(t instanceof TestClass);
        assert.strictEqual(test2.test, test);
        //This needs to be deepEqual because where comparing the generated proxy, and deepEqual will make a deep equal assertion
        assert.deepEqual(test.test2, test2);
        assert.strictEqual(test.test2.test.propertyA, "test");
      });
      test("circular dependency resolution complex case", () => {
        container.register("serviceA", { useClass: ServiceA });
        container.register("serviceB", { useClass: ServiceB });
        container.register("serviceC", { useClass: ServiceC });
        container.register("serviceD", { useClass: ServiceD });

        /*
                        When resolving for ServiceA the path is:
                        ServiceA(A) -> ServiceB(A) -> ServiceA(B)P -> ServiceD(B) -> ServiceA(D)P -> ServiceC(D) -> ServiceB(C)P -> ServiceD(C)P -> ServiceC(A)
                        //Creation result
                        ServiceA(A) -> ServiceB(A) -> proxy(ServiceA(B)) -> ServiceD(B) -> proxy(ServiceA(D)) -> ServiceC(D) -> proxy(ServiceB(C)) -> proxy(ServiceD(C)) -> ServiceC(A)
                    */

        const serviceA = container.resolve<ServiceA>("serviceA");
        const serviceB = container.resolve<ServiceB>("serviceB");
        const serviceC = container.resolve<ServiceC>("serviceC");
        const serviceD = container.resolve<ServiceD>("serviceD");

        assert.ok(serviceA instanceof ServiceA);
        assert.ok(serviceA.serviceB instanceof ServiceB);
        assert.ok(serviceA.serviceB.serviceA instanceof ServiceA);
        assert.ok(serviceA.serviceB.serviceD instanceof ServiceD);
        assert.ok(serviceA.serviceC instanceof ServiceC);
        assert.ok(serviceA.serviceC.serviceB instanceof ServiceB);
        assert.ok(serviceA.serviceC.serviceD instanceof ServiceD);
        assert.ok(serviceB instanceof ServiceB);
        assert.ok(serviceB.serviceA instanceof ServiceA);
        assert.ok(serviceB.serviceA.serviceB instanceof ServiceB);
        assert.ok(serviceB.serviceA.serviceC instanceof ServiceC);
        assert.ok(serviceB.serviceD instanceof ServiceD);
        assert.ok(serviceB.serviceD.serviceA instanceof ServiceA);
        assert.ok(serviceB.serviceD.serviceC instanceof ServiceC);
        assert.ok(serviceC instanceof ServiceC);
        assert.ok(serviceC.serviceB instanceof ServiceB);
        assert.ok(serviceC.serviceB.serviceA instanceof ServiceA);
        assert.ok(serviceC.serviceB.serviceD instanceof ServiceD);
        assert.ok(serviceC.serviceD instanceof ServiceD);
        assert.ok(serviceC.serviceD.serviceA instanceof ServiceA);
        assert.ok(serviceC.serviceD.serviceC instanceof ServiceC);
        assert.ok(serviceD instanceof ServiceD);
        assert.ok(serviceD.serviceA instanceof ServiceA);
        assert.ok(serviceD.serviceA.serviceB instanceof ServiceB);
        assert.ok(serviceD.serviceA.serviceC instanceof ServiceC);
        assert.ok(serviceD.serviceC instanceof ServiceC);
        assert.ok(serviceD.serviceC.serviceB instanceof ServiceB);
        assert.ok(serviceD.serviceC.serviceD instanceof ServiceD);

        assert.strictEqual(serviceA.serviceB, serviceB); //Instance
        assert.deepEqual(serviceA.serviceB.serviceA, serviceA); //Proxy
        assert.strictEqual(serviceA.serviceB.serviceD, serviceD); //Instance
        assert.strictEqual(serviceA.serviceC, serviceC); //Instance
        assert.deepEqual(serviceA.serviceC.serviceB, serviceB); //Proxy
        assert.deepEqual(serviceA.serviceC.serviceD, serviceD); //Proxy
        assert.deepEqual(serviceB.serviceA, serviceA); //Proxy
        assert.strictEqual(serviceB.serviceA.serviceB, serviceB); //Instance
        assert.strictEqual(serviceB.serviceA.serviceC, serviceC); //Instance
        assert.strictEqual(serviceB.serviceD, serviceD); //Instance
        assert.deepEqual(serviceB.serviceD.serviceA, serviceA); //Proxy
        assert.strictEqual(serviceB.serviceD.serviceC, serviceC); //Instance
        assert.deepEqual(serviceC.serviceB, serviceB); //Proxy
        assert.deepEqual(serviceC.serviceB.serviceA, serviceA); //Proxy
        assert.strictEqual(serviceC.serviceB.serviceD, serviceD); //Instance
        assert.deepEqual(serviceC.serviceD, serviceD); //Proxy
        assert.deepEqual(serviceC.serviceD.serviceA, serviceA); //Proxy
        assert.strictEqual(serviceC.serviceD.serviceC, serviceC); //Instance
        assert.deepEqual(serviceD.serviceA, serviceA); //Proxy
        assert.strictEqual(serviceD.serviceA.serviceB, serviceB); //Proxy
        assert.strictEqual(serviceD.serviceA.serviceC, serviceC); //Proxy
        assert.strictEqual(serviceD.serviceC, serviceC); //Instance
        assert.deepEqual(serviceD.serviceC.serviceB, serviceB); //Proxy
        assert.deepEqual(serviceD.serviceC.serviceD, serviceD); //Proxy
      });
    });
    describe("Decorators", () => {
      describe("Class", () => {
        test("circular dependency resolution simple case", () => {
          @Singleton("test", ["test2"])
          class TestClass {
            public propertyA = "test";
            constructor(public test2: TestClass2) {}
          }
          @Singleton("test2", ["test"])
          class TestClass2 {
            constructor(public test: TestClass) {}
          }

          const test = container.resolve<TestClass>("test");
          const test2 = container.resolve<TestClass2>("test2");
          assert.ok(test instanceof TestClass);
          assert.ok(test2 instanceof TestClass2);
          assert.ok(test.test2 instanceof TestClass2);
          assert.ok(test2.test instanceof TestClass);
          assert.strictEqual(test.test2, test2);
          //This needs to be deepEqual because where comparing the generated proxy, and deepEqual will make a deep equal assertion
          assert.deepEqual(test2.test, test);
        });
        test("circular dependency complex case", () => {
          @Singleton("serviceA", ["serviceB", "serviceC"])
          class ServiceA {
            constructor(
              public serviceB: ServiceB,
              public serviceC: ServiceC,
            ) {}
          }
          @Singleton("serviceB", ["serviceA", "serviceD"])
          class ServiceB {
            constructor(
              public serviceA: ServiceA,
              public serviceD: ServiceD,
            ) {}
          }
          @Singleton("serviceC", ["serviceB", "serviceD"])
          class ServiceC {
            constructor(
              public serviceB: ServiceB,
              public serviceD: ServiceD,
            ) {}
          }
          @Singleton("serviceD", ["serviceA", "serviceC"])
          class ServiceD {
            constructor(
              public serviceA: ServiceA,
              public serviceC: ServiceC,
            ) {}
          }
          /*
                        When resolving for ServiceA the path is:
                        ServiceA(A) -> ServiceB(A) -> ServiceA(B)P -> ServiceD(B) -> ServiceA(D)P -> ServiceC(D) -> ServiceB(C)P -> ServiceD(C)P -> ServiceC(A)
                        //Creation result
                        ServiceA(A) -> ServiceB(A) -> proxy(ServiceA(B)) -> ServiceD(B) -> proxy(ServiceA(D)) -> ServiceC(D) -> proxy(ServiceB(C)) -> proxy(ServiceD(C)) -> ServiceC(A)
                    */

          const serviceA = container.resolve<ServiceA>("serviceA");
          const serviceB = container.resolve<ServiceB>("serviceB");
          const serviceC = container.resolve<ServiceC>("serviceC");
          const serviceD = container.resolve<ServiceD>("serviceD");

          assert.ok(serviceA instanceof ServiceA);
          assert.ok(serviceA.serviceB instanceof ServiceB);
          assert.ok(serviceA.serviceB.serviceA instanceof ServiceA);
          assert.ok(serviceA.serviceB.serviceD instanceof ServiceD);
          assert.ok(serviceA.serviceC instanceof ServiceC);
          assert.ok(serviceA.serviceC.serviceB instanceof ServiceB);
          assert.ok(serviceA.serviceC.serviceD instanceof ServiceD);
          assert.ok(serviceB instanceof ServiceB);
          assert.ok(serviceB.serviceA instanceof ServiceA);
          assert.ok(serviceB.serviceA.serviceB instanceof ServiceB);
          assert.ok(serviceB.serviceA.serviceC instanceof ServiceC);
          assert.ok(serviceB.serviceD instanceof ServiceD);
          assert.ok(serviceB.serviceD.serviceA instanceof ServiceA);
          assert.ok(serviceB.serviceD.serviceC instanceof ServiceC);
          assert.ok(serviceC instanceof ServiceC);
          assert.ok(serviceC.serviceB instanceof ServiceB);
          assert.ok(serviceC.serviceB.serviceA instanceof ServiceA);
          assert.ok(serviceC.serviceB.serviceD instanceof ServiceD);
          assert.ok(serviceC.serviceD instanceof ServiceD);
          assert.ok(serviceC.serviceD.serviceA instanceof ServiceA);
          assert.ok(serviceC.serviceD.serviceC instanceof ServiceC);
          assert.ok(serviceD instanceof ServiceD);
          assert.ok(serviceD.serviceA instanceof ServiceA);
          assert.ok(serviceD.serviceA.serviceB instanceof ServiceB);
          assert.ok(serviceD.serviceA.serviceC instanceof ServiceC);
          assert.ok(serviceD.serviceC instanceof ServiceC);
          assert.ok(serviceD.serviceC.serviceB instanceof ServiceB);
          assert.ok(serviceD.serviceC.serviceD instanceof ServiceD);

          assert.strictEqual(serviceA.serviceB, serviceB); //Instance
          assert.deepEqual(serviceA.serviceB.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceA.serviceB.serviceD, serviceD); //Instance
          assert.strictEqual(serviceA.serviceC, serviceC); //Instance
          assert.deepEqual(serviceA.serviceC.serviceB, serviceB); //Proxy
          assert.deepEqual(serviceA.serviceC.serviceD, serviceD); //Proxy
          assert.deepEqual(serviceB.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceB.serviceA.serviceB, serviceB); //Instance
          assert.strictEqual(serviceB.serviceA.serviceC, serviceC); //Instance
          assert.strictEqual(serviceB.serviceD, serviceD); //Instance
          assert.deepEqual(serviceB.serviceD.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceB.serviceD.serviceC, serviceC); //Instance
          assert.deepEqual(serviceC.serviceB, serviceB); //Proxy
          assert.deepEqual(serviceC.serviceB.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceC.serviceB.serviceD, serviceD); //Instance
          assert.deepEqual(serviceC.serviceD, serviceD); //Proxy
          assert.deepEqual(serviceC.serviceD.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceC.serviceD.serviceC, serviceC); //Instance
          assert.deepEqual(serviceD.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceD.serviceA.serviceB, serviceB); //Proxy
          assert.strictEqual(serviceD.serviceA.serviceC, serviceC); //Proxy
          assert.strictEqual(serviceD.serviceC, serviceC); //Instance
          assert.deepEqual(serviceD.serviceC.serviceB, serviceB); //Proxy
          assert.deepEqual(serviceD.serviceC.serviceD, serviceD); //Proxy
        });
        test("Lazily created proxy allows iterating over keys of the original service", () => {
          @Transient(["TestB"])
          class TestA {
            constructor(public b: TestB) {}
          }
          @Transient("TestB", [TestA])
          class TestB {
            public name = "testB";
            public prop = {
              defined: false,
            };
            constructor(public a: TestA) {}
          }
          const a = container.resolve(TestA);
          const b = container.resolve(TestB);
          assert.ok(a instanceof TestA);
          assert.ok(b instanceof TestB);
          assert.deepStrictEqual(Object.keys(a), ["b"]);
          assert.deepStrictEqual(
            Object.keys(b).sort(),
            ["a", "name", "prop"].sort(),
          );
          assert.deepStrictEqual(Object.getOwnPropertyNames(a), ["b"]);
          assert.deepStrictEqual(
            Object.getOwnPropertyNames(b).sort(),
            ["a", "name", "prop"].sort(),
          );
        });
      });
      describe("Interface", () => {
        test("simple case", () => {
          interface TC {
            readonly propertyA: string;
            readonly test2: TC2;
          }
          const TC = createInterfaceId<TC>("TC");
          interface TC2 {
            readonly test: TC;
          }
          const TC2 = createInterfaceId<TC2>("TC2");

          @Singleton(TC, [TC2])
          class TestClass implements TC {
            public propertyA = "test";
            constructor(public test2: TestClass2) {}
          }
          @Singleton(TC2, [TC])
          class TestClass2 implements TC2 {
            constructor(public test: TestClass) {}
          }
          const test2 = container.resolve<TC2>(TC2);
          const test = container.resolve<TestClass>(TC);
          assert.ok(test2 instanceof TestClass2);
          assert.ok(test instanceof TestClass);
          assert.ok(test2.test instanceof TestClass);
          assert.ok(test.test2 instanceof TestClass2);
          assert.strictEqual(test2.test, test);
          //This needs to be deepEqual because where comparing the generated proxy, and deepEqual will make a deep equal assertion
          assert.deepEqual(test.test2, test2);
        });
        test("Lazy creation with proxies allow circular dependencies using interfaces", () => {
          interface ITestA {
            name: string;
          }
          interface ITestB {
            name: string;
          }
          const ITestA = createInterfaceId("Ia03");
          const ITestB = createInterfaceId("Ib03");

          @Transient(ITestA, [ITestB])
          class TestA implements ITestA {
            public name = "testA";
            constructor(public b: ITestB) {}
          }

          @Transient(ITestB, [ITestA])
          class TestB implements ITestB {
            public name = "testB";
            constructor(public a: ITestA) {}
          }

          const a = container.resolve<TestA>(ITestA);
          const b = container.resolve<TestB>(ITestB);
          assert.ok(a instanceof TestA);
          assert.ok(a.b instanceof TestB);
          assert.ok(b.a instanceof TestA);
          assert.strictEqual(a.b.name, "testB");
        });
        test("circular dependency complex case", async () => {
          interface SA {
            readonly serviceB: SB;
            readonly serviceC: SC;
          }
          const SA = createInterfaceId<SA>("SA");
          interface SB {
            readonly serviceA: SA;
            readonly serviceD: SD;
          }
          const SB = createInterfaceId<SB>("SB");
          interface SC {
            readonly serviceB: SB;
            readonly serviceD: SD;
          }
          const SC = createInterfaceId<SC>("SC");
          interface SD {
            readonly serviceA: SA;
            readonly serviceC: SC;
          }
          const SD = createInterfaceId<SD>("SD");
          @Singleton(SA, [SB, SC])
          class ServiceA {
            constructor(
              public serviceB: ServiceB,
              public serviceC: ServiceC,
            ) {}
          }
          @Singleton(SB, [SA, SD])
          class ServiceB {
            constructor(
              public serviceA: ServiceA,
              public serviceD: ServiceD,
            ) {}
          }
          @Singleton(SC, [SB, SD])
          class ServiceC {
            constructor(
              public serviceB: ServiceB,
              public serviceD: ServiceD,
            ) {}
          }
          @Singleton(SD, [SA, SC])
          class ServiceD {
            constructor(
              public serviceA: ServiceA,
              public serviceC: ServiceC,
            ) {}
          }
          /*
                        When resolving for ServiceA the path is:
                        ServiceA(A) -> ServiceB(A) -> ServiceA(B)P -> ServiceD(B) -> ServiceA(D)P -> ServiceC(D) -> ServiceB(C)P -> ServiceD(C)P -> ServiceC(A)
                        //Creation result
                        ServiceA(A) -> ServiceB(A) -> proxy(ServiceA(B)) -> ServiceD(B) -> proxy(ServiceA(D)) -> ServiceC(D) -> proxy(ServiceB(C)) -> proxy(ServiceD(C)) -> ServiceC(A)
                    */

          const serviceA = container.resolve<ServiceA>(SA);
          const serviceB = container.resolve<ServiceB>(SB);
          const serviceC = container.resolve<ServiceC>(ServiceC);
          const serviceD = container.resolve<ServiceD>(ServiceD);

          assert.ok(serviceA instanceof ServiceA);
          assert.ok(serviceA.serviceB instanceof ServiceB);
          assert.ok(serviceA.serviceB.serviceA instanceof ServiceA);
          assert.ok(serviceA.serviceB.serviceD instanceof ServiceD);
          assert.ok(serviceA.serviceC instanceof ServiceC);
          assert.ok(serviceA.serviceC.serviceB instanceof ServiceB);
          assert.ok(serviceA.serviceC.serviceD instanceof ServiceD);
          assert.ok(serviceB instanceof ServiceB);
          assert.ok(serviceB.serviceA instanceof ServiceA);
          assert.ok(serviceB.serviceA.serviceB instanceof ServiceB);
          assert.ok(serviceB.serviceA.serviceC instanceof ServiceC);
          assert.ok(serviceB.serviceD instanceof ServiceD);
          assert.ok(serviceB.serviceD.serviceA instanceof ServiceA);
          assert.ok(serviceB.serviceD.serviceC instanceof ServiceC);
          assert.ok(serviceC instanceof ServiceC);
          assert.ok(serviceC.serviceB instanceof ServiceB);
          assert.ok(serviceC.serviceB.serviceA instanceof ServiceA);
          assert.ok(serviceC.serviceB.serviceD instanceof ServiceD);
          assert.ok(serviceC.serviceD instanceof ServiceD);
          assert.ok(serviceC.serviceD.serviceA instanceof ServiceA);
          assert.ok(serviceC.serviceD.serviceC instanceof ServiceC);
          assert.ok(serviceD instanceof ServiceD);
          assert.ok(serviceD.serviceA instanceof ServiceA);
          assert.ok(serviceD.serviceA.serviceB instanceof ServiceB);
          assert.ok(serviceD.serviceA.serviceC instanceof ServiceC);
          assert.ok(serviceD.serviceC instanceof ServiceC);
          assert.ok(serviceD.serviceC.serviceB instanceof ServiceB);
          assert.ok(serviceD.serviceC.serviceD instanceof ServiceD);

          assert.strictEqual(serviceA.serviceB, serviceB); //Instance
          assert.deepEqual(serviceA.serviceB.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceA.serviceB.serviceD, serviceD); //Instance
          assert.strictEqual(serviceA.serviceC, serviceC); //Instance
          assert.deepEqual(serviceA.serviceC.serviceB, serviceB); //Proxy
          assert.deepEqual(serviceA.serviceC.serviceD, serviceD); //Proxy
          assert.deepEqual(serviceB.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceB.serviceA.serviceB, serviceB); //Instance
          assert.strictEqual(serviceB.serviceA.serviceC, serviceC); //Instance
          assert.strictEqual(serviceB.serviceD, serviceD); //Instance
          assert.deepEqual(serviceB.serviceD.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceB.serviceD.serviceC, serviceC); //Instance
          assert.deepEqual(serviceC.serviceB, serviceB); //Proxy
          assert.deepEqual(serviceC.serviceB.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceC.serviceB.serviceD, serviceD); //Instance
          assert.deepEqual(serviceC.serviceD, serviceD); //Proxy
          assert.deepEqual(serviceC.serviceD.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceC.serviceD.serviceC, serviceC); //Instance
          assert.deepEqual(serviceD.serviceA, serviceA); //Proxy
          assert.strictEqual(serviceD.serviceA.serviceB, serviceB); //Proxy
          assert.strictEqual(serviceD.serviceA.serviceC, serviceC); //Proxy
          assert.strictEqual(serviceD.serviceC, serviceC); //Instance
          assert.deepEqual(serviceD.serviceC.serviceB, serviceB); //Proxy
          assert.deepEqual(serviceD.serviceC.serviceD, serviceD); //Proxy
        });
      });
    });
  });
});
