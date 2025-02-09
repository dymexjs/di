import { beforeEach, describe, test } from "node:test";
import * as assert from "node:assert";
import {
  container,
  getInterfaceToken,
  IContainerResolve,
  Lifetime,
  Singleton,
  STATIC_INJECTION_LIFETIME,
  STATIC_INJECTIONS,
  StaticInjectable,
  Transient,
} from "../../src/index.ts";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => container.dispose());
  describe("async", () => {
    describe("Static inject", () => {
      class ServiceA implements StaticInjectable<typeof ServiceA> {
        public serviceB: ServiceB;
        public serviceC: ServiceC;
        constructor(serviceB: ServiceB, serviceC: ServiceC) {
          this.serviceB = serviceB;
          this.serviceC = serviceC;
        }
        public static [STATIC_INJECTIONS] = ["serviceB", "serviceC"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceB implements StaticInjectable<typeof ServiceB> {
        public serviceA: ServiceA;
        public serviceD: ServiceD;
        constructor(serviceA: ServiceA, serviceD: ServiceD) {
          this.serviceA = serviceA;
          this.serviceD = serviceD;
        }
        public static [STATIC_INJECTIONS] = ["serviceA", "serviceD"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceC implements StaticInjectable<typeof ServiceC> {
        public serviceB: ServiceB;
        public serviceD: ServiceD;
        constructor(serviceB: ServiceB, serviceD: ServiceD) {
          this.serviceB = serviceB;
          this.serviceD = serviceD;
        }
        public static [STATIC_INJECTIONS] = ["serviceB", "serviceD"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceD implements StaticInjectable<typeof ServiceD> {
        public serviceA: ServiceA;
        public serviceC: ServiceC;
        constructor(serviceA: ServiceA, serviceC: ServiceC) {
          this.serviceA = serviceA;
          this.serviceC = serviceC;
        }
        public static [STATIC_INJECTIONS] = ["serviceA", "serviceC"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }

      test("circular dependency resolution simple case", () => {
        const factoryTest = (cont: IContainerResolve) => {
          return cont.resolve(TestClass);
        };
        const factoryTest2 = (cont: IContainerResolve) => {
          return cont.resolve(TestClass2);
        };
        class TestClass2 implements StaticInjectable<typeof TestClass2> {
          public test: TestClass;
          constructor(test: TestClass) {
            this.test = test;
          }
          public static [STATIC_INJECTIONS] = ["factoryTest"];
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        class TestClass implements StaticInjectable<typeof TestClass> {
          public propertyA = "test";
          public test2: TestClass2;
          constructor(test2: TestClass2) {
            this.test2 = test2;
          }
          public static [STATIC_INJECTIONS] = ["factoryTest2"];
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        container.registerFactory("factoryTest", factoryTest, [
          getInterfaceToken("IContainer"),
        ]);
        container.registerFactory("factoryTest2", factoryTest2, [
          getInterfaceToken("IContainer"),
        ]);
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
            public test2: TestClass2;
            constructor(test2: TestClass2) {
              this.test2 = test2;
            }
          }
          @Singleton("test2", ["test"])
          class TestClass2 {
            public test: TestClass;
            constructor(test: TestClass) {
              this.test = test;
            }
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
            public serviceB: ServiceB;
            public serviceC: ServiceC;
            constructor(serviceB: ServiceB, serviceC: ServiceC) {
              this.serviceB = serviceB;
              this.serviceC = serviceC;
            }
          }
          @Singleton("serviceB", ["serviceA", "serviceD"])
          class ServiceB {
            public serviceA: ServiceA;
            public serviceD: ServiceD;
            constructor(serviceA: ServiceA, serviceD: ServiceD) {
              this.serviceA = serviceA;
              this.serviceD = serviceD;
            }
          }
          @Singleton("serviceC", ["serviceB", "serviceD"])
          class ServiceC {
            public serviceB: ServiceB;
            public serviceD: ServiceD;
            constructor(serviceB: ServiceB, serviceD: ServiceD) {
              this.serviceB = serviceB;
              this.serviceD = serviceD;
            }
          }
          @Singleton("serviceD", ["serviceA", "serviceC"])
          class ServiceD {
            public serviceA: ServiceA;
            public serviceC: ServiceC;
            constructor(serviceA: ServiceA, serviceC: ServiceC) {
              this.serviceA = serviceA;
              this.serviceC = serviceC;
            }
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
            public b: TestB;
            constructor(b: TestB) {
              this.b = b;
            }
          }
          @Transient("TestB", [TestA])
          class TestB {
            public name = "testB";
            public prop = {
              defined: false,
            };
            public a: TestA;
            constructor(a: TestA) {
              this.a = a;
            }
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
          const TC = getInterfaceToken("TC");
          interface TC2 {
            readonly test: TC;
          }
          const TC2 = getInterfaceToken("TC2");

          @Singleton(TC, [TC2])
          class TestClass implements TC {
            public propertyA = "test";
            public test2: TestClass2;
            constructor(test2: TestClass2) {
              this.test2 = test2;
            }
          }
          @Singleton(TC2, [TC])
          class TestClass2 implements TC2 {
            public test: TestClass;
            constructor(test: TestClass) {
              this.test = test;
            }
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
          const ITestA = getInterfaceToken("Ia03");
          const ITestB = getInterfaceToken("Ib03");

          @Transient(ITestA, [ITestB])
          class TestA implements ITestA {
            public name = "testA";
            public b: ITestB;
            constructor(b: ITestB) {
              this.b = b;
            }
          }

          @Transient(ITestB, [ITestA])
          class TestB implements ITestB {
            public name = "testB";
            public a: ITestA;
            constructor(a: ITestA) {
              this.a = a;
            }
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
          const SA = getInterfaceToken("SA");
          interface SB {
            readonly serviceA: SA;
            readonly serviceD: SD;
          }
          const SB = getInterfaceToken("SB");
          interface SC {
            readonly serviceB: SB;
            readonly serviceD: SD;
          }
          const SC = getInterfaceToken("SC");
          interface SD {
            readonly serviceA: SA;
            readonly serviceC: SC;
          }
          const SD = getInterfaceToken("SD");
          @Singleton(SA, [SB, SC])
          class ServiceA {
            public serviceB: ServiceB;
            public serviceC: ServiceC;
            constructor(serviceB: ServiceB, serviceC: ServiceC) {
              this.serviceB = serviceB;
              this.serviceC = serviceC;
            }
          }
          @Singleton(SB, [SA, SD])
          class ServiceB {
            public serviceA: ServiceA;
            public serviceD: ServiceD;
            constructor(serviceA: ServiceA, serviceD: ServiceD) {
              this.serviceA = serviceA;
              this.serviceD = serviceD;
            }
          }
          @Singleton(SC, [SB, SD])
          class ServiceC {
            public serviceB: ServiceB;
            public serviceD: ServiceD;
            constructor(serviceB: ServiceB, serviceD: ServiceD) {
              this.serviceB = serviceB;
              this.serviceD = serviceD;
            }
          }
          @Singleton(SD, [SA, SC])
          class ServiceD {
            public serviceA: ServiceA;
            public serviceC: ServiceC;
            constructor(serviceA: ServiceA, serviceC: ServiceC) {
              this.serviceA = serviceA;
              this.serviceC = serviceC;
            }
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
