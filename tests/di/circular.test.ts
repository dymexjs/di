import { beforeEach, describe, expect, test } from "@jest/globals";
import { STATIC_INJECT_KEY, STATIC_INJECT_LIFETIME } from '../../src/di/constants';
import { Lifetime } from "../../src/di/types/registration";
import { container } from "../../src/di/container";
import { StaticInjectable } from "../../src/di/types/staticInject";
import { IContainer } from "../../src/di/types/container.interface";
import { createInterfaceId, Singleton } from "../../src/di/decorators";


describe("Averix_DI ",()=>{
    beforeEach(async ()=> await container.reset());
    describe("Static inject",()=>{
        class ServiceA implements StaticInjectable<typeof ServiceA>{
            constructor(public serviceB: ServiceB, public serviceC: ServiceC){}
            public static [STATIC_INJECT_KEY] = ["serviceB", "serviceC"];
            public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
        }
        class ServiceB implements StaticInjectable<typeof ServiceB>{
            constructor(public serviceA: ServiceA, public serviceD: ServiceD){}
            public static [STATIC_INJECT_KEY] = ["serviceA", "serviceD"];
            public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
        }
        class ServiceC implements StaticInjectable<typeof ServiceC>{
            constructor(public serviceB: ServiceB, public serviceD: ServiceD){}
            public static [STATIC_INJECT_KEY] = ["serviceB", "serviceD"];
            public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
        }
        class ServiceD implements StaticInjectable<typeof ServiceD>{
            constructor(public serviceA: ServiceA, public serviceC: ServiceC){}
            public static [STATIC_INJECT_KEY] = ["serviceA", "serviceC"];
            public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
        }
        describe("sync",()=>{
            test("circular dependency resolution simple case", () => {
                class TestClass2 implements StaticInjectable<typeof TestClass2> {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["test"];
                    public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
                }
                class TestClass implements StaticInjectable<typeof TestClass> {
                    public propertyA = "test";
                    constructor(public test2: TestClass2){}
                    public static [STATIC_INJECT_KEY] = [TestClass2];
                }
                container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Singleton });
                const test2 = container.resolve<TestClass2>(TestClass2);
                const test = container.resolve<TestClass>("test");
                expect(test2).toBeInstanceOf(TestClass2);
                expect(test).toBeInstanceOf(TestClass);
                expect(test2.test).toBeInstanceOf(TestClass);
                expect(test.test2).toBeInstanceOf(TestClass2);
                expect(test2.test).toBe(test);
                //This needs to be toEqual because where comparing the generated proxy, and toEqual will make a deep equal assertion
                expect(test.test2).toEqual(test2);
            });
            test("circular dependency resolution complex case", () => {
                container.register("serviceA",{useClass: ServiceA});
                container.register("serviceB",{useClass: ServiceB});
                container.register("serviceC",{useClass: ServiceC});
                container.register("serviceD",{useClass: ServiceD});
    
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
    
                expect(serviceA.serviceB).toBe(serviceB);               //Instance
                expect(serviceA.serviceB.serviceA).toEqual(serviceA);   //Proxy
                expect(serviceA.serviceB.serviceD).toBe(serviceD);      //Instance
                expect(serviceA.serviceC).toBe(serviceC);               //Instance
                expect(serviceA.serviceC.serviceB).toEqual(serviceB);   //Proxy
                expect(serviceA.serviceC.serviceD).toEqual(serviceD);   //Proxy
                expect(serviceB.serviceA).toEqual(serviceA);            //Proxy
                expect(serviceB.serviceA.serviceB).toBe(serviceB);      //Instance
                expect(serviceB.serviceA.serviceC).toBe(serviceC);      //Instance
                expect(serviceB.serviceD).toBe(serviceD);               //Instance
                expect(serviceB.serviceD.serviceA).toEqual(serviceA);   //Proxy
                expect(serviceB.serviceD.serviceC).toBe(serviceC);      //Instance
                expect(serviceC.serviceB).toEqual(serviceB);            //Proxy
                expect(serviceC.serviceB.serviceA).toEqual(serviceA);   //Proxy
                expect(serviceC.serviceB.serviceD).toBe(serviceD);      //Instance
                expect(serviceC.serviceD).toEqual(serviceD);            //Proxy
                expect(serviceC.serviceD.serviceA).toEqual(serviceA);   //Proxy
                expect(serviceC.serviceD.serviceC).toBe(serviceC);      //Instance
                expect(serviceD.serviceA).toEqual(serviceA);            //Proxy
                expect(serviceD.serviceA.serviceB).toBe(serviceB);      //Proxy
                expect(serviceD.serviceA.serviceC).toBe(serviceC);      //Proxy
                expect(serviceD.serviceC).toBe(serviceC);               //Instance
                expect(serviceD.serviceC.serviceB).toEqual(serviceB);   //Proxy
                expect(serviceD.serviceC.serviceD).toEqual(serviceD);   //Proxy
            });
        });
        describe("async", ()=>{
            test("circular dependency resolution simple case", async () => {
                const factoryTest = async (cont: IContainer) => {
                    return await cont.resolveAsync(TestClass);
                }
                const factoryTest2 = async (cont: IContainer) => {
                    return await cont.resolveAsync(TestClass2);
                }
                class TestClass2 implements StaticInjectable<typeof TestClass2> {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["factoryTest"];
                    public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
                }
                class TestClass implements StaticInjectable<typeof TestClass> {
                    public propertyA = "test";
                    constructor(public test2: TestClass2){}
                    public static [STATIC_INJECT_KEY] = ["factoryTest2"];
                    public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
                }
                container.register("factoryTest", { useFactory: factoryTest });
                container.register("factoryTest2", { useFactory: factoryTest2 });
                const test2 = await container.resolveAsync<TestClass2>(TestClass2);
                const test = await container.resolveAsync<TestClass>(TestClass);
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
            test("circular dependency resolution complex case", async () => {
                
    
                container.register("serviceA",{useClass: ServiceA});
                container.register("serviceB",{useClass: ServiceB});
                container.register("serviceC",{useClass: ServiceC});
                container.register("serviceD",{useClass: ServiceD});
    
                /*
                    When resolving for ServiceA the path is:
                    ServiceA(A) -> ServiceB(A) -> ServiceA(B)P -> ServiceD(B) -> ServiceA(D)P -> ServiceC(D) -> ServiceB(C)P -> ServiceD(C)P -> ServiceC(A)
                    //Creation result
                    ServiceA(A) -> ServiceB(A) -> proxy(ServiceA(B)) -> ServiceD(B) -> proxy(ServiceA(D)) -> ServiceC(D) -> proxy(ServiceB(C)) -> proxy(ServiceD(C)) -> ServiceC(A)
                */
    
                const serviceA = await container.resolveAsync<ServiceA>("serviceA");
                const serviceB = await container.resolveAsync<ServiceB>("serviceB");
                const serviceC = await container.resolveAsync<ServiceC>("serviceC");
                const serviceD = await container.resolveAsync<ServiceD>("serviceD");
    
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
    
                expect(serviceA.serviceB).toBe(serviceB);               //Instance
                expect(serviceA.serviceB.serviceA).toEqual(serviceA);   //Proxy
                expect(serviceA.serviceB.serviceD).toBe(serviceD);      //Instance
                expect(serviceA.serviceC).toBe(serviceC);               //Instance
                expect(serviceA.serviceC.serviceB).toEqual(serviceB);   //Proxy
                expect(serviceA.serviceC.serviceD).toEqual(serviceD);   //Proxy
                expect(serviceB.serviceA).toEqual(serviceA);            //Proxy
                expect(serviceB.serviceA.serviceB).toBe(serviceB);      //Instance
                expect(serviceB.serviceA.serviceC).toBe(serviceC);      //Instance
                expect(serviceB.serviceD).toBe(serviceD);               //Instance
                expect(serviceB.serviceD.serviceA).toEqual(serviceA);   //Proxy
                expect(serviceB.serviceD.serviceC).toBe(serviceC);      //Instance
                expect(serviceC.serviceB).toEqual(serviceB);            //Proxy
                expect(serviceC.serviceB.serviceA).toEqual(serviceA);   //Proxy
                expect(serviceC.serviceB.serviceD).toBe(serviceD);      //Instance
                expect(serviceC.serviceD).toEqual(serviceD);            //Proxy
                expect(serviceC.serviceD.serviceA).toEqual(serviceA);   //Proxy
                expect(serviceC.serviceD.serviceC).toBe(serviceC);      //Instance
                expect(serviceD.serviceA).toEqual(serviceA);            //Proxy
                expect(serviceD.serviceA.serviceB).toBe(serviceB);      //Proxy
                expect(serviceD.serviceA.serviceC).toBe(serviceC);      //Proxy
                expect(serviceD.serviceC).toBe(serviceC);               //Instance
                expect(serviceD.serviceC.serviceB).toEqual(serviceB);   //Proxy
                expect(serviceD.serviceC.serviceD).toEqual(serviceD);   //Proxy
            });
        });
    });
    describe("Decorators",()=>{
        describe("Class",()=>{
            test("circular dependency resolution simple case", () => {
                @Singleton("test", ["test2"])
                class TestClass {
                    public propertyA = "test";
                    constructor(public test2: TestClass2){}
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
                //This needs to be toEqual because where comparing the generated proxy, and toEqual will make a deep equal assertion
                expect(test2.test).toEqual(test);
            });
            test("circular dependency complex case",()=>{
                @Singleton("serviceA", ["serviceB", "serviceC"])
                class ServiceA {
                    constructor(public serviceB: ServiceB, public serviceC: ServiceC){}
                }
                @Singleton("serviceB", ["serviceA", "serviceD"])
                class ServiceB {
                    constructor(public serviceA: ServiceA, public serviceD: ServiceD){}
                }
                @Singleton("serviceC", ["serviceB", "serviceD"])
                class ServiceC {
                    constructor(public serviceB: ServiceB, public serviceD: ServiceD){}
                }
                @Singleton("serviceD", ["serviceA", "serviceC"])
                class ServiceD {
                    constructor(public serviceA: ServiceA, public serviceC: ServiceC){}
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
        
                    expect(serviceA.serviceB).toBe(serviceB);               //Instance
                    expect(serviceA.serviceB.serviceA).toEqual(serviceA);   //Proxy
                    expect(serviceA.serviceB.serviceD).toBe(serviceD);      //Instance
                    expect(serviceA.serviceC).toBe(serviceC);               //Instance
                    expect(serviceA.serviceC.serviceB).toEqual(serviceB);   //Proxy
                    expect(serviceA.serviceC.serviceD).toEqual(serviceD);   //Proxy
                    expect(serviceB.serviceA).toEqual(serviceA);            //Proxy
                    expect(serviceB.serviceA.serviceB).toBe(serviceB);      //Instance
                    expect(serviceB.serviceA.serviceC).toBe(serviceC);      //Instance
                    expect(serviceB.serviceD).toBe(serviceD);               //Instance
                    expect(serviceB.serviceD.serviceA).toEqual(serviceA);   //Proxy
                    expect(serviceB.serviceD.serviceC).toBe(serviceC);      //Instance
                    expect(serviceC.serviceB).toEqual(serviceB);            //Proxy
                    expect(serviceC.serviceB.serviceA).toEqual(serviceA);   //Proxy
                    expect(serviceC.serviceB.serviceD).toBe(serviceD);      //Instance
                    expect(serviceC.serviceD).toEqual(serviceD);            //Proxy
                    expect(serviceC.serviceD.serviceA).toEqual(serviceA);   //Proxy
                    expect(serviceC.serviceD.serviceC).toBe(serviceC);      //Instance
                    expect(serviceD.serviceA).toEqual(serviceA);            //Proxy
                    expect(serviceD.serviceA.serviceB).toBe(serviceB);      //Proxy
                    expect(serviceD.serviceA.serviceC).toBe(serviceC);      //Proxy
                    expect(serviceD.serviceC).toBe(serviceC);               //Instance
                    expect(serviceD.serviceC.serviceB).toEqual(serviceB);   //Proxy
                    expect(serviceD.serviceC.serviceD).toEqual(serviceD);   //Proxy
            });
        });
        describe("Interface",()=>{
            test("simple case",()=>{
                interface TC {
                    readonly propertyA: string;
                    readonly test2: TC2;
                }
                const TC = createInterfaceId<TC>("TC");
                interface TC2 {
                    readonly test: TC;
                }
                const TC2 = createInterfaceId<TC2>("TC2");

                @Singleton(TC,[TC2])
                class TestClass implements TC {
                    public propertyA = "test";
                    constructor(public test2: TestClass2){}
                }
                @Singleton(TC2,[TC])
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
            test("circular dependency complex case",()=>{
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
                @Singleton(SA,[SB, SC])
                class ServiceA {
                    constructor(public serviceB: ServiceB, public serviceC: ServiceC){}
                }
                @Singleton(SB,[SA, SD])
                class ServiceB {
                    constructor(public serviceA: ServiceA, public serviceD: ServiceD){}
                }
                @Singleton(SC,[SB, SD])
                class ServiceC {
                    constructor(public serviceB: ServiceB, public serviceD: ServiceD){}
                }
                @Singleton(SD,[SA, SC])
                class ServiceD {
                    constructor(public serviceA: ServiceA, public serviceC: ServiceC){}
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
        
                    expect(serviceA.serviceB).toBe(serviceB);               //Instance
                    expect(serviceA.serviceB.serviceA).toEqual(serviceA);   //Proxy
                    expect(serviceA.serviceB.serviceD).toBe(serviceD);      //Instance
                    expect(serviceA.serviceC).toBe(serviceC);               //Instance
                    expect(serviceA.serviceC.serviceB).toEqual(serviceB);   //Proxy
                    expect(serviceA.serviceC.serviceD).toEqual(serviceD);   //Proxy
                    expect(serviceB.serviceA).toEqual(serviceA);            //Proxy
                    expect(serviceB.serviceA.serviceB).toBe(serviceB);      //Instance
                    expect(serviceB.serviceA.serviceC).toBe(serviceC);      //Instance
                    expect(serviceB.serviceD).toBe(serviceD);               //Instance
                    expect(serviceB.serviceD.serviceA).toEqual(serviceA);   //Proxy
                    expect(serviceB.serviceD.serviceC).toBe(serviceC);      //Instance
                    expect(serviceC.serviceB).toEqual(serviceB);            //Proxy
                    expect(serviceC.serviceB.serviceA).toEqual(serviceA);   //Proxy
                    expect(serviceC.serviceB.serviceD).toBe(serviceD);      //Instance
                    expect(serviceC.serviceD).toEqual(serviceD);            //Proxy
                    expect(serviceC.serviceD.serviceA).toEqual(serviceA);   //Proxy
                    expect(serviceC.serviceD.serviceC).toBe(serviceC);      //Instance
                    expect(serviceD.serviceA).toEqual(serviceA);            //Proxy
                    expect(serviceD.serviceA.serviceB).toBe(serviceB);      //Proxy
                    expect(serviceD.serviceA.serviceC).toBe(serviceC);      //Proxy
                    expect(serviceD.serviceC).toBe(serviceC);               //Instance
                    expect(serviceD.serviceC.serviceB).toEqual(serviceB);   //Proxy
                    expect(serviceD.serviceC.serviceD).toEqual(serviceD);   //Proxy
            });
        });
    });
});