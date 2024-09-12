import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../src/di/container";
import { STATIC_INJECT_KEY, STATIC_INJECT_LIFETIME } from "../../src/di/constants";
import { Lifetime } from "../../src/di/types/Registration";
import { StaticInjectable } from "../../src/di/types/IStaticInject";
import { IContainer } from "../../src/di/types/IContainer";

describe("Averix_DI", () => {
    beforeEach(() => container.reset());
    describe("Static Injector", () => {
        describe("sync", () => {
            test("should register and resolve with static injector", () => {
                class TestClass {
                    public propertyA = "test";
                }
                class TestClass2 {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["test"];
                }
                container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Singleton });
                const test2 = container.resolve<TestClass2>(TestClass2);
                const test = container.resolve<TestClass>("test");
                expect(test2).toBeInstanceOf(TestClass2);
                expect(test2.test).toBeInstanceOf(TestClass);
                expect(test2.test.propertyA).toBe("test");
                expect(test2.test).toBe(test);
                test.propertyA = "test2";
                const test3 = container.resolve<TestClass>("test");
                expect(test3).toBeInstanceOf(TestClass);
                expect(test3.propertyA).toBe("test2");
                expect(test2.test).toBe(test3);
            });
            test("should register singleton from STATIC_INJECT_LIFETIME", () => {
                class TestClass {
                    public propertyA = "test";
                    public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
                }
                class TestClass2 {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["test"];
                }
                container.register("test", { useClass: TestClass });
                const test2 = container.resolve<TestClass2>(TestClass2);
                const test = container.resolve<TestClass>("test");
                expect(test2).toBeInstanceOf(TestClass2);
                expect(test2.test).toBeInstanceOf(TestClass);
                expect(test2.test.propertyA).toBe("test");
                expect(test2.test).toBe(test);
                test.propertyA = "test2";
                const test3 = container.resolve<TestClass>("test");
                expect(test3).toBeInstanceOf(TestClass);
                expect(test3.propertyA).toBe("test2");
                expect(test2.test).toBe(test3);
            });
            test("should register singleton from impements StaticInjectable", () => {
                class TestClass implements StaticInjectable<typeof TestClass> {
                    public propertyA = "test";
                    public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
                }
                class TestClass2 implements StaticInjectable<typeof TestClass2> {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["test"];
                }
                container.register("test", { useClass: TestClass });
                const test2 = container.resolve<TestClass2>(TestClass2);
                const test = container.resolve<TestClass>("test");
                expect(test2).toBeInstanceOf(TestClass2);
                expect(test2.test).toBeInstanceOf(TestClass);
                expect(test2.test.propertyA).toBe("test");
                expect(test2.test).toBe(test);
                test.propertyA = "test2";
                const test3 = container.resolve<TestClass>("test");
                expect(test3).toBeInstanceOf(TestClass);
                expect(test3.propertyA).toBe("test2");
                expect(test2.test).toBe(test3);
            });
        });
        describe("async", () => {
            test("should register and resolve with static injector async", async () => {
                class TestClass implements StaticInjectable<typeof TestClass> {
                    public propertyA = "test";
                }
                class TestClass2 implements StaticInjectable<typeof TestClass2> {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["test"];
                }
                container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Singleton });
                const test2 = await container.resolveAsync<TestClass2>(TestClass2);
                const test = await container.resolveAsync<TestClass>("test");
                expect(test2).toBeInstanceOf(TestClass2);
                expect(test2.test).toBeInstanceOf(TestClass);
                expect(test2.test.propertyA).toBe("test");
                expect(test2.test).toBe(test);
                test.propertyA = "test2";
                const test3 = await container.resolveAsync<TestClass>("test");
                expect(test3).toBeInstanceOf(TestClass);
                expect(test3.propertyA).toBe("test2");
                expect(test2.test).toBe(test3);
            });
            test("should register singleton from STATIC_INJECT_LIFETIME async", async () => {
                class TestClass implements StaticInjectable<typeof TestClass> {
                    public propertyA = "test";
                    public static [STATIC_INJECT_LIFETIME] = Lifetime.Singleton;
                }
                class TestClass2 implements StaticInjectable<typeof TestClass2> {
                    constructor(public test: TestClass) {}
                    public static [STATIC_INJECT_KEY] = ["test"];
                }
                container.register("test", { useClass: TestClass });
                const test2 = await container.resolveAsync<TestClass2>(TestClass2);
                const test = await container.resolveAsync<TestClass>("test");
                expect(test2).toBeInstanceOf(TestClass2);
                expect(test2.test).toBeInstanceOf(TestClass);
                expect(test2.test.propertyA).toBe("test");
                expect(test2.test).toBe(test);
                test.propertyA = "test2";
                const test3 = await container.resolveAsync<TestClass>("test");
                expect(test3).toBeInstanceOf(TestClass);
                expect(test3.propertyA).toBe("test2");
                expect(test2.test).toBe(test3);
            });
            test("should register async factory and resolve with STATIC_INJECT_KEY", async () => {
                const factory = async (cont: IContainer) => Promise.resolve(cont);
                class TestClass implements StaticInjectable<typeof TestClass> {
                    constructor(public test2: TestClass2){}
                    static [STATIC_INJECT_KEY] = ["test2"];
                }
                class TestClass2 implements StaticInjectable<typeof TestClass2> {
                    constructor(public cont: IContainer){}
                    static [STATIC_INJECT_KEY] = ["factory"];
                }
                container.register("factory", { useFactory: factory });
                container.register("test", { useClass: TestClass }, { lifetime: Lifetime.Singleton });
                container.register("test2", { useClass: TestClass2 }, { lifetime: Lifetime.Singleton });
                const test = await container.resolveAsync<TestClass>("test");
                expect(test).toBeInstanceOf(TestClass);
                expect(test.test2).toBeInstanceOf(TestClass2);
                expect(test.test2.cont).toBe(container);
            });
        });
    });
});
