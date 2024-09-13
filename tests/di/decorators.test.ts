import { describe, expect, test } from "@jest/globals";
import { container } from "../../src/di/container";
import { createInterfaceId, Scoped, ScopedInterface, Singleton, SingletonInterface, Transient, TransientInterface } from '../../src/di/decorators';
import { UndefinedScopeError } from "../../src/di/exceptions/UndefinedScopeError";



describe("Averix_DI",()=>{
    describe("Class Decorators",()=>{
        test("should create an target and inject singleton",()=>{
            @Singleton()
            class ServiceA {}
            @Singleton([ServiceA])
            class ServiceB {
                constructor(public serviceA: ServiceA){}
            }
            const b = container.resolve<ServiceB>(ServiceB);
            expect(b).toBeInstanceOf(ServiceB);
            expect(b.serviceA).toBeInstanceOf(ServiceA);
            const a = container.resolve<ServiceA>(ServiceA);
            expect(a).toBeInstanceOf(ServiceA);
            expect(b.serviceA).toBe(a);
        });
        test("should create an target and inject transient",()=>{
            @Transient()
            class ServiceA {}
            @Singleton([ServiceA])
            class ServiceB {
                constructor(public serviceA: ServiceA){}
            }
            const b = container.resolve<ServiceB>(ServiceB);
            expect(b).toBeInstanceOf(ServiceB);
            expect(b.serviceA).toBeInstanceOf(ServiceA);
            const a = container.resolve<ServiceA>(ServiceA);
            expect(a).toBeInstanceOf(ServiceA);
            expect(b.serviceA).not.toBe(a);
            expect(b.serviceA).toEqual(a);
        });
        test("should create transients",()=>{
            @Transient()
            class ServiceA {}
            @Transient([ServiceA])
            class ServiceB {
                constructor(public serviceA: ServiceA){}
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
        test("should create scoped",()=>{
            @Scoped()
            class ServiceA {}
            @Scoped([ServiceA])
            class ServiceB {
                constructor(public serviceA: ServiceA){}
            }
            const scope = container.createScope();
            const b = container.resolve<ServiceB>(ServiceB, scope);
            expect(b).toBeInstanceOf(ServiceB);
            expect(b.serviceA).toBeInstanceOf(ServiceA);
            const a = container.resolve<ServiceA>(ServiceA, scope);
            expect(a).toBeInstanceOf(ServiceA);
            expect(b.serviceA).toBe(a);
            expect(()=>container.resolve<ServiceB>(ServiceB)).toThrow(UndefinedScopeError);
        });
    });
    describe("Interface Decorators",()=>{
        test("should create an target and inject singleton",()=>{
            interface SA {}
            const SA = createInterfaceId<SA>("SA");
            interface SB {
                readonly serviceA: SA;
            }
            const SB = createInterfaceId<SB>("SB");
            
            @SingletonInterface(SA)
            class ServiceA {}
            @SingletonInterface(SB,[SA])
            class ServiceB {
                constructor(public serviceA: SA){}
            }
            const b = container.resolve<SB>(SB);
            expect(b).toBeInstanceOf(ServiceB);
            expect(b.serviceA).toBeInstanceOf(ServiceA);
            const a = container.resolve<SA>(SA);
            expect(a).toBeInstanceOf(ServiceA);
            expect(b.serviceA).toBe(a);
        });
        test("should create an target and inject transient",()=>{
            interface SA {}
            const SA = createInterfaceId<SA>("SA");
            interface SB {
                readonly serviceA: SA;
            }
            const SB = createInterfaceId<SB>("SB");
            
            @TransientInterface(SA)
            class ServiceA {}
            @SingletonInterface(SB,[SA])
            class ServiceB {
                constructor(public serviceA: SA){}
            }
            const b = container.resolve<SB>(SB);
            expect(b).toBeInstanceOf(ServiceB);
            expect(b.serviceA).toBeInstanceOf(ServiceA);
            const a = container.resolve<SA>(SA);
            expect(a).toBeInstanceOf(ServiceA);
            expect(b.serviceA).not.toBe(a);
            expect(b.serviceA).toEqual(a);
        });
        test("should create transients",()=>{
            interface SA {}
            const SA = createInterfaceId<SA>("SA");
            interface SB {
                readonly serviceA: SA;
            }
            const SB = createInterfaceId<SB>("SB");
            @TransientInterface(SA)
            class ServiceA {}
            @TransientInterface(SB,[SA])
            class ServiceB {
                constructor(public serviceA: SA){}
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
        test("should create scoped",()=>{
            interface SA {}
            const SA = createInterfaceId<SA>("SA");
            interface SB {
                readonly serviceA: SA;
            }
            const SB = createInterfaceId<SB>("SB");
            @ScopedInterface(SA)
            class ServiceA {}
            @ScopedInterface(SB,[SA])
            class ServiceB {
                constructor(public serviceA: SA){}
            }
            const scope = container.createScope();
            const b = container.resolve<SB>(SB, scope);
            expect(b).toBeInstanceOf(ServiceB);
            expect(b.serviceA).toBeInstanceOf(ServiceA);
            const a = container.resolve<SA>(SA, scope);
            expect(a).toBeInstanceOf(ServiceA);
            expect(b.serviceA).toBe(a);
            expect(b.serviceA).toEqual(a);
            expect(()=>container.resolve<SB>(SB)).toThrow(UndefinedScopeError);
        });
    });
});