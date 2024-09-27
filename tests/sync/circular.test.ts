import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../src/container";
import { StaticInjectable } from "../../src/types/static-inject.interface";
import {
  STATIC_INJECTIONS,
  STATIC_INJECTION_LIFETIME,
} from "../../src/constants";
import { Lifetime } from "../../src/types/registration.interface";
import { IContainer } from "../../src/types/container.interface";
import { createInterfaceId, Singleton, Transient } from "../../src/decorators";

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
        expect(test2).toBeInstanceOf(TestClass2);
        expect(test).toBeInstanceOf(TestClass);
        expect(test2.test).toBeInstanceOf(TestClass);
        const t = test.test2.test;
        expect(t).toBeInstanceOf(TestClass);
        expect(test2.test).toBe(test);
        //This needs to be toEqual because where comparing the generated proxy, and toEqual will make a deep equal assertion
        expect(test.test2).toEqual(test2);
        expect(test.test2.test.propertyA).toBe("test");
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

        expect(serviceA).toBeInstanceOf(ServiceA);
        expect(serviceA.serviceB).toBeInstanceOf(ServiceB);
        expect(serviceA.serviceB.serviceA).toBeInstanceOf(ServiceA);
        expect(serviceA.serviceB.serviceD).toBeInstanceOf(ServiceD);
        expect(serviceA.serviceC).toBeInstanceOf(ServiceC);
        expect(serviceA.serviceC.serviceB).toBeInstanceOf(ServiceB);
        expect(serviceA.serviceC.serviceD).toBeInstanceOf(ServiceD);
        expect(serviceB).toBeInstanceOf(ServiceB);
        expect(serviceB.serviceA).toBeInstanceOf(ServiceA);
        expect(serviceB.serviceA.serviceB).toBeInstanceOf(ServiceB);
        expect(serviceB.serviceA.serviceC).toBeInstanceOf(ServiceC);
        expect(serviceB.serviceD).toBeInstanceOf(ServiceD);
        expect(serviceB.serviceD.serviceA).toBeInstanceOf(ServiceA);
        expect(serviceB.serviceD.serviceC).toBeInstanceOf(ServiceC);
        expect(serviceC).toBeInstanceOf(ServiceC);
        expect(serviceC.serviceB).toBeInstanceOf(ServiceB);
        expect(serviceC.serviceB.serviceA).toBeInstanceOf(ServiceA);
        expect(serviceC.serviceB.serviceD).toBeInstanceOf(ServiceD);
        expect(serviceC.serviceD).toBeInstanceOf(ServiceD);
        expect(serviceC.serviceD.serviceA).toBeInstanceOf(ServiceA);
        expect(serviceC.serviceD.serviceC).toBeInstanceOf(ServiceC);
        expect(serviceD).toBeInstanceOf(ServiceD);
        expect(serviceD.serviceA).toBeInstanceOf(ServiceA);
        expect(serviceD.serviceA.serviceB).toBeInstanceOf(ServiceB);
        expect(serviceD.serviceA.serviceC).toBeInstanceOf(ServiceC);
        expect(serviceD.serviceC).toBeInstanceOf(ServiceC);
        expect(serviceD.serviceC.serviceB).toBeInstanceOf(ServiceB);
        expect(serviceD.serviceC.serviceD).toBeInstanceOf(ServiceD);

        expect(serviceA.serviceB).toBe(serviceB); //Instance
        expect(serviceA.serviceB.serviceA).toEqual(serviceA); //Proxy
        expect(serviceA.serviceB.serviceD).toBe(serviceD); //Instance
        expect(serviceA.serviceC).toBe(serviceC); //Instance
        expect(serviceA.serviceC.serviceB).toEqual(serviceB); //Proxy
        expect(serviceA.serviceC.serviceD).toEqual(serviceD); //Proxy
        expect(serviceB.serviceA).toEqual(serviceA); //Proxy
        expect(serviceB.serviceA.serviceB).toBe(serviceB); //Instance
        expect(serviceB.serviceA.serviceC).toBe(serviceC); //Instance
        expect(serviceB.serviceD).toBe(serviceD); //Instance
        expect(serviceB.serviceD.serviceA).toEqual(serviceA); //Proxy
        expect(serviceB.serviceD.serviceC).toBe(serviceC); //Instance
        expect(serviceC.serviceB).toEqual(serviceB); //Proxy
        expect(serviceC.serviceB.serviceA).toEqual(serviceA); //Proxy
        expect(serviceC.serviceB.serviceD).toBe(serviceD); //Instance
        expect(serviceC.serviceD).toEqual(serviceD); //Proxy
        expect(serviceC.serviceD.serviceA).toEqual(serviceA); //Proxy
        expect(serviceC.serviceD.serviceC).toBe(serviceC); //Instance
        expect(serviceD.serviceA).toEqual(serviceA); //Proxy
        expect(serviceD.serviceA.serviceB).toBe(serviceB); //Proxy
        expect(serviceD.serviceA.serviceC).toBe(serviceC); //Proxy
        expect(serviceD.serviceC).toBe(serviceC); //Instance
        expect(serviceD.serviceC.serviceB).toEqual(serviceB); //Proxy
        expect(serviceD.serviceC.serviceD).toEqual(serviceD); //Proxy
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
          expect(test).toBeInstanceOf(TestClass);
          expect(test2).toBeInstanceOf(TestClass2);
          expect(test.test2).toBeInstanceOf(TestClass2);
          expect(test2.test).toBeInstanceOf(TestClass);
          expect(test.test2).toBe(test2);
          //This needs to be toEqual because we are comparing the generated proxy, and toEqual will make a deep equal assertion
          expect(test2.test).toEqual(test);
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

          expect(serviceA).toBeInstanceOf(ServiceA);
          expect(serviceA.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceA.serviceB.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceA.serviceB.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceA.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceA.serviceC.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceA.serviceC.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceB).toBeInstanceOf(ServiceB);
          expect(serviceB.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceB.serviceA.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceB.serviceA.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceB.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceB.serviceD.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceB.serviceD.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceC).toBeInstanceOf(ServiceC);
          expect(serviceC.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceC.serviceB.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceC.serviceB.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceC.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceC.serviceD.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceC.serviceD.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceD).toBeInstanceOf(ServiceD);
          expect(serviceD.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceD.serviceA.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceD.serviceA.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceD.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceD.serviceC.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceD.serviceC.serviceD).toBeInstanceOf(ServiceD);

          expect(serviceA.serviceB).toBe(serviceB); //Instance
          expect(serviceA.serviceB.serviceA).toEqual(serviceA); //Proxy
          expect(serviceA.serviceB.serviceD).toBe(serviceD); //Instance
          expect(serviceA.serviceC).toBe(serviceC); //Instance
          expect(serviceA.serviceC.serviceB).toEqual(serviceB); //Proxy
          expect(serviceA.serviceC.serviceD).toEqual(serviceD); //Proxy
          expect(serviceB.serviceA).toEqual(serviceA); //Proxy
          expect(serviceB.serviceA.serviceB).toBe(serviceB); //Instance
          expect(serviceB.serviceA.serviceC).toBe(serviceC); //Instance
          expect(serviceB.serviceD).toBe(serviceD); //Instance
          expect(serviceB.serviceD.serviceA).toEqual(serviceA); //Proxy
          expect(serviceB.serviceD.serviceC).toBe(serviceC); //Instance
          expect(serviceC.serviceB).toEqual(serviceB); //Proxy
          expect(serviceC.serviceB.serviceA).toEqual(serviceA); //Proxy
          expect(serviceC.serviceB.serviceD).toBe(serviceD); //Instance
          expect(serviceC.serviceD).toEqual(serviceD); //Proxy
          expect(serviceC.serviceD.serviceA).toEqual(serviceA); //Proxy
          expect(serviceC.serviceD.serviceC).toBe(serviceC); //Instance
          expect(serviceD.serviceA).toEqual(serviceA); //Proxy
          expect(serviceD.serviceA.serviceB).toBe(serviceB); //Proxy
          expect(serviceD.serviceA.serviceC).toBe(serviceC); //Proxy
          expect(serviceD.serviceC).toBe(serviceC); //Instance
          expect(serviceD.serviceC.serviceB).toEqual(serviceB); //Proxy
          expect(serviceD.serviceC.serviceD).toEqual(serviceD); //Proxy
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
          expect(a).toBeInstanceOf(TestA);
          expect(b).toBeInstanceOf(TestB);
          expect(Object.keys(a)).toStrictEqual(["b"]);
          expect(Object.keys(b)).toStrictEqual(["a", "name", "prop"]);
          expect(Object.getOwnPropertyNames(a)).toStrictEqual(["b"]);
          expect(Object.getOwnPropertyNames(b)).toStrictEqual([
            "a",
            "name",
            "prop",
          ]);
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
          expect(test2).toBeInstanceOf(TestClass2);
          expect(test).toBeInstanceOf(TestClass);
          expect(test2.test).toBeInstanceOf(TestClass);
          expect(test.test2).toBeInstanceOf(TestClass2);
          expect(test2.test).toBe(test);
          //This needs to be toEqual because where comparing the generated proxy, and toEqual will make a deep equal assertion
          expect(test.test2).toEqual(test2);
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
          expect(a).toBeInstanceOf(TestA);
          expect(a.b).toBeInstanceOf(TestB);
          expect(b.a).toBeInstanceOf(TestA);
          expect(a.b.name).toBe("testB");
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

          expect(serviceA).toBeInstanceOf(ServiceA);
          expect(serviceA.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceA.serviceB.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceA.serviceB.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceA.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceA.serviceC.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceA.serviceC.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceB).toBeInstanceOf(ServiceB);
          expect(serviceB.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceB.serviceA.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceB.serviceA.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceB.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceB.serviceD.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceB.serviceD.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceC).toBeInstanceOf(ServiceC);
          expect(serviceC.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceC.serviceB.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceC.serviceB.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceC.serviceD).toBeInstanceOf(ServiceD);
          expect(serviceC.serviceD.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceC.serviceD.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceD).toBeInstanceOf(ServiceD);
          expect(serviceD.serviceA).toBeInstanceOf(ServiceA);
          expect(serviceD.serviceA.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceD.serviceA.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceD.serviceC).toBeInstanceOf(ServiceC);
          expect(serviceD.serviceC.serviceB).toBeInstanceOf(ServiceB);
          expect(serviceD.serviceC.serviceD).toBeInstanceOf(ServiceD);

          expect(serviceA.serviceB).toBe(serviceB); //Instance
          expect(serviceA.serviceB.serviceA).toEqual(serviceA); //Proxy
          expect(serviceA.serviceB.serviceD).toBe(serviceD); //Instance
          expect(serviceA.serviceC).toBe(serviceC); //Instance
          expect(serviceA.serviceC.serviceB).toEqual(serviceB); //Proxy
          expect(serviceA.serviceC.serviceD).toEqual(serviceD); //Proxy
          expect(serviceB.serviceA).toEqual(serviceA); //Proxy
          expect(serviceB.serviceA.serviceB).toBe(serviceB); //Instance
          expect(serviceB.serviceA.serviceC).toBe(serviceC); //Instance
          expect(serviceB.serviceD).toBe(serviceD); //Instance
          expect(serviceB.serviceD.serviceA).toEqual(serviceA); //Proxy
          expect(serviceB.serviceD.serviceC).toBe(serviceC); //Instance
          expect(serviceC.serviceB).toEqual(serviceB); //Proxy
          expect(serviceC.serviceB.serviceA).toEqual(serviceA); //Proxy
          expect(serviceC.serviceB.serviceD).toBe(serviceD); //Instance
          expect(serviceC.serviceD).toEqual(serviceD); //Proxy
          expect(serviceC.serviceD.serviceA).toEqual(serviceA); //Proxy
          expect(serviceC.serviceD.serviceC).toBe(serviceC); //Instance
          expect(serviceD.serviceA).toEqual(serviceA); //Proxy
          expect(serviceD.serviceA.serviceB).toBe(serviceB); //Proxy
          expect(serviceD.serviceA.serviceC).toBe(serviceC); //Proxy
          expect(serviceD.serviceC).toBe(serviceC); //Instance
          expect(serviceD.serviceC.serviceB).toEqual(serviceB); //Proxy
          expect(serviceD.serviceC.serviceD).toEqual(serviceD); //Proxy
        });
      });
    });
  });
});
