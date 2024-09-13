import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../src/di/container";
import { ScopeContext } from "../../src/di/scopeContext";
import { Lifetime } from "../../src/di/types/registration";
import { STATIC_INJECT_LIFETIME } from "../../src/di/constants";
import { UndefinedScopeError } from "../../src/di/exceptions/UndefinedScopeError";

describe("Averix_DI", () => {
    beforeEach(()=>container.reset());
    describe("scope", () => {
        describe("create and dispose scope", () => {
            test("create scope", () => {
                expect(container.createScope()).toBeInstanceOf(ScopeContext);
                expect(container.scopes.size).toBe(1);
            });
            test("dispose scope", () => {
                const scope = container.createScope();
                expect(container.scopes.size).toBe(1);
                expect(scope).toBeInstanceOf(ScopeContext);
                container.disposeScope(scope);
                expect(container.scopes.size).toBe(0);
            });
        });
        describe("Class provider", () => {
            test("should register and resolve scoped correctly", () => {
                class TestClass {
                    public propertyA = "test";
                }
                const scope = container.createScope();
                container.register(TestClass, TestClass, { lifetime: Lifetime.Scoped });
                const value = container.resolve<TestClass>(TestClass, scope);
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
                value.propertyA = "test2";
                const value2 = container.resolve<TestClass>(TestClass, scope);
                expect(value2).toBeInstanceOf(TestClass);
                expect(value2.propertyA).toBe("test2");
            });
            test("should register and resolve scoped wrongly because scope is diferent", () => {
                class TestClass {
                    public propertyA = "test";
                }
                const scope = container.createScope();
                container.register(TestClass, TestClass, { lifetime: Lifetime.Scoped });
                const value = container.resolve<TestClass>(TestClass, scope);
                expect(value).toBeInstanceOf(TestClass);
                expect(value.propertyA).toBe("test");
                value.propertyA = "test2";
                const scope2 = container.createScope();
                const value2 = container.resolve<TestClass>(TestClass, scope2);
                expect(value2).toBeInstanceOf(TestClass);
                expect(value2.propertyA).toBe("test");
            });
        });
        describe("other",()=>{
            describe("sync",()=>{
                test("register constructor in scope",()=>{
                    class Test {
                        static [STATIC_INJECT_LIFETIME] = Lifetime.Scoped;
                    }
                    const scope = container.createScope();
                    const test = container.resolve(Test,scope);
                    expect(container.hasRegistration(Test)).toBe(true);
                    expect(test).toBeInstanceOf(Test);
                });
                test("throw register constructor without scope",()=>{
                    class Test {
                        static [STATIC_INJECT_LIFETIME] = Lifetime.Scoped;
                    }
                    expect(()=>container.resolve(Test)).toThrow(UndefinedScopeError);
                });    
            });
            describe("async",()=>{
                test("register constructor in scope",async ()=>{
                    class Test {
                        static [STATIC_INJECT_LIFETIME] = Lifetime.Scoped;
                    }
                    const scope = container.createScope();
                    const test = await container.resolveAsync(Test,scope);
                    expect(container.hasRegistration(Test)).toBe(true);
                    expect(test).toBeInstanceOf(Test);
                });
                test("throw register constructor without scope",()=>{
                    class Test {
                        static [STATIC_INJECT_LIFETIME] = Lifetime.Scoped;
                    }
                    expect(container.resolveAsync(Test)).rejects.toThrow(UndefinedScopeError);
                });
    
            });
        });
    });
});
