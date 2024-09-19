import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from '../../../src/di/container';
import { createInterfaceId, Scoped, Singleton, Transient } from '../../../src/di/decorators';
import { UndefinedScopeError } from "../../../src/di/exceptions/UndefinedScopeError";

describe("Averix_DI", () => {
    beforeEach(async () => await container.reset());
    describe("sync", () => {
        describe("Class Decorators", () => {
            test("should work with @Singleton decorator", () => {
                @Singleton()
                class TestClass {}
                const instance1 = container.resolve(TestClass);
                const instance2 = container.resolve(TestClass);
                expect(instance1).toBe(instance2);
            });
            test("should work with @Transient decorator", () => {
                @Transient()
                class TestClass {}
                const instance1 = container.resolve(TestClass);
                const instance2 = container.resolve(TestClass);
                expect(instance1).not.toBe(instance2);
            });
            test("should work with @Scoped decorator", () => {
                @Scoped()
                class TestClass {}
                const scope = container.createScope();
                const instance1 = container.resolve(TestClass, scope);
                const instance2 = container.resolve(TestClass, scope);
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
            test("should redirect the registration",()=>{
                @Singleton()
                class Test{}

                class TestMock{}

                @Transient([Test])
                class TestClass {
                    constructor(public readonly test: Test){}
                }
                container.registerType(Test, TestMock);
                const test = container.resolve<TestClass>(TestClass);
                expect(test.test).toBeInstanceOf(TestMock);
            });
        });
    describe("Interface Decorators", () => {
            test("should create an target and inject singleton", () => {
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
        describe("async", () => {
            test("should create an target and inject singleton", async () => {
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
                expect(container.resolveAsync<SB>(SB)).rejects.toThrow(UndefinedScopeError);
            });
        });
    });
});
