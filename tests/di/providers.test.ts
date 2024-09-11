import { describe, expect, test } from "@jest/globals";
import { getProviderType, isClassProvider, isFactoryProvider, isProvider, isValueProvider, Provider, ProvidersType } from "../../src/di/types";


describe("Provider", () => {
    describe("Invalid provider",()=>{
        test("isProvider",()=>{
            expect(isProvider("test")).toBe(false);
        });
        test("getProviderType",()=>{
            expect(()=>getProviderType("test" as any)).toThrow("Invalid provider type: test");
        })
    });
    describe("ValueProvider", () => {
        test("isProvider", () => {
            expect(isProvider({ useValue: "test" })).toBe(true);
        });
        test("getProviderType", () => {
            expect(getProviderType({ useValue: "test" })).toBe(ProvidersType.ValueProvider);
        });
        test("isValueProvider true",()=>{
            expect(isValueProvider({ useValue: "test" })).toBe(true);
        });
        test("isValueProvider false",()=>{
            expect(isValueProvider({} as Provider<unknown>)).toBe(false);
        });
    });
    describe("ClassProvider", () => {
        class TestClass {}
        test("isProvider", () => {
            expect(isProvider({ useClass: TestClass })).toBe(true);
        });
        test("getProviderType", () => {
            expect(getProviderType({ useClass: TestClass })).toBe(ProvidersType.ClassProvider);
        });
        test("isClassProvider true",()=>{
            expect(isClassProvider({ useClass: TestClass })).toBe(true);
        });
        test("isClassProvider false",()=>{
            expect(isClassProvider({} as Provider<unknown>)).toBe(false);
        });
    });
    describe("Factory provider", () => {
        test("isProvider", () => {
            expect(isProvider({ useFactory: () => {} })).toBe(true);
        });
        test("getProviderType", () => {
            expect(getProviderType({ useFactory: () => {} })).toBe(ProvidersType.FactoryProvider);
        });
        test("isFactoryProvider true",()=>{
            expect(isFactoryProvider({ useFactory: () => {} })).toBe(true);
        });
        test("isFactoryProvider false",()=>{
            expect(isFactoryProvider({} as Provider<unknown>)).toBe(false);
        })
    });
});
