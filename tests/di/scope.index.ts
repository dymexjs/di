import { describe, expect, test } from "@jest/globals";
import { container } from "../../src/di/container";
import { ScopeContext } from "../../src/di/ScopeContext";
import { Lifetime } from "../../src/di/types/Registration";


describe("Averix_DI",()=>{
    describe("scope", () => {
        describe("create and dispose scope",()=>{
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
        describe("Class provider",()=>{
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
    });
});