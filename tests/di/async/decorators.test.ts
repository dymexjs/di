import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../../src/di/container";
import { createInterfaceId, Scoped, Singleton, Transient } from "../../../src/di/decorators";
import { UndefinedScopeError } from "../../../src/di/exceptions/UndefinedScopeError";

describe("Averix_DI", () => {
    beforeEach(async () => await container.reset());
    describe("async", () => {
        describe("Class Decorators", () => {
            test("should work with @Singleton decorator", async () => {
                @Singleton()
                class TestClass {}
                const instance1 = await container.resolveAsync(TestClass);
                const instance2 = await container.resolveAsync(TestClass);
                expect(instance1).toBe(instance2);
            });
            test("should work with @Transient decorator", async () => {
                @Transient()
                class TestClass {}
                const instance1 = await container.resolveAsync(TestClass);
                const instance2 = await container.resolveAsync(TestClass);
                expect(instance1).not.toBe(instance2);
            });
            test("should work with @Scoped decorator", async () => {
                @Scoped()
                class TestClass {}
                const scope = container.createScope();
                const instance1 = await container.resolveAsync(TestClass, scope);
                const instance2 = await container.resolveAsync(TestClass, scope);
                expect(instance1).toBe(instance2);
            });
            test("should create an target and inject singleton", async () => {
                @Singleton("serviceA")
                class ServiceA {}
                @Singleton(["serviceA"])
                class ServiceB {
                    constructor(public serviceA: ServiceA) {}
                }
                const b = await container.resolveAsync<ServiceB>(ServiceB);
                expect(b).toBeInstanceOf(ServiceB);
                expect(b.serviceA).toBeInstanceOf(ServiceA);
                const a = await container.resolveAsync<ServiceA>("serviceA");
                expect(a).toBeInstanceOf(ServiceA);
                expect(b.serviceA).toBe(a);
            });
            test("should create an target and inject transient", async () => {
                @Transient()
                class ServiceA {}
                @Singleton([ServiceA])
                class ServiceB {
                    constructor(public serviceA: ServiceA) {}
                }
                const b = await container.resolveAsync<ServiceB>(ServiceB);
                expect(b).toBeInstanceOf(ServiceB);
                expect(b.serviceA).toBeInstanceOf(ServiceA);
                const a = await container.resolveAsync<ServiceA>(ServiceA);
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
                const b = await container.resolveAsync<ServiceB>(ServiceB);
                expect(b).toBeInstanceOf(ServiceB);
                expect(b.serviceA).toBeInstanceOf(ServiceA);
                const a = await container.resolveAsync<ServiceA>(ServiceA);
                expect(a).toBeInstanceOf(ServiceA);
                expect(b.serviceA).not.toBe(a);
                expect(b.serviceA).toEqual(a);
                const b2 = await container.resolveAsync<ServiceB>(ServiceB);
                expect(b).not.toBe(b2);
                expect(b).toEqual(b2);
            });
            test("should create scoped", async () => {
                @Scoped()
                class ServiceA {}
                @Scoped([ServiceA])
                class ServiceB {
                    constructor(public serviceA: ServiceA) {}
                }
                const scope = container.createScope();
                const b = await container.resolveAsync<ServiceB>(ServiceB, scope);
                expect(b).toBeInstanceOf(ServiceB);
                expect(b.serviceA).toBeInstanceOf(ServiceA);
                const a = await container.resolveAsync<ServiceA>(ServiceA, scope);
                expect(a).toBeInstanceOf(ServiceA);
                expect(b.serviceA).toBe(a);
                expect(container.resolveAsync<ServiceB>(ServiceB)).rejects.toThrow(UndefinedScopeError);
            });
            test("should redirect the registration",async ()=>{
                @Singleton()
                class Test{}

                class TestMock{}

                @Transient([Test])
                class TestClass {
                    constructor(public readonly test: Test){}
                }
                container.registerType(Test, TestMock);
                const test = await container.resolveAsync<TestClass>(TestClass);
                expect(test.test).toBeInstanceOf(TestMock);
            });
        });
    describe("Interface Decorators", () => {
            test("should create an target and inject singleton",async  () => {
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
