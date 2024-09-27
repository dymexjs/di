import { beforeEach, describe, expect, test } from "@jest/globals";
import { InvalidDecoratorError } from "../src/exceptions/InvalidDecoratorError";
import {
  AutoInjectable,
  Scoped,
  Singleton,
  Transient,
} from "../src/decorators";
import { ServiceMap } from "../src/service-map";
import { Registration } from "../src/types/registration.interface";
import { container } from "../src/container";
import { TokenNotFoundError } from "../src/exceptions/TokenNotFoundError";

describe("Dymexjs_DI ", () => {
  describe("Other", () => {
    describe("Decorators - InvalidDecoratorError", () => {
      test("Singleton", () => {
        expect(
          () =>
            class Test {
              //@ts-expect-error  This should throw because the decorator is invalid here
              @Singleton("test")
              prop: number = 1;
            },
        ).toThrow(InvalidDecoratorError);
      });
      test("Transient", () => {
        expect(
          () =>
            class Test {
              //@ts-expect-error  This should throw because the decorator is invalid here
              @Transient("test")
              prop: number = 1;
            },
        ).toThrow(InvalidDecoratorError);
      });
      test("Scoped", () => {
        expect(
          () =>
            class Test {
              //@ts-expect-error  This should throw because the decorator is invalid here
              @Scoped("test")
              prop: number = 1;
            },
        ).toThrow(InvalidDecoratorError);
      });
      test("AutoInjectable", () => {
        expect(
          () =>
            class Test {
              //@ts-expect-error  This should throw because the decorator is invalid here
              @AutoInjectable()
              prop: number = 1;
            },
        ).toThrow(InvalidDecoratorError);
      });
    });
    describe("ServiceMap", () => {
      test("should create a ServiceMapInstance that implements AsyncDisposable", () => {
        const serviceMap = new ServiceMap();
        expect(serviceMap).toBeInstanceOf(ServiceMap);
        expect(serviceMap[Symbol.asyncDispose]).toBeInstanceOf(Function);
      });
      describe("Service Map methods", () => {
        const serviceMap = new ServiceMap();
        const registration: Registration = {
          injections: [],
          provider: { useValue: "test" },
          providerType: 0,
          options: { lifetime: 0 },
        };
        const registration2: Registration = {
          injections: [],
          provider: { useValue: "test" },
          providerType: 1,
          options: { lifetime: 0 },
        };

        beforeEach(async () => serviceMap[Symbol.asyncDispose]);
        test("should ensure key existence", () => {
          serviceMap.has("anyKey");
          expect(serviceMap.getAll("anyKey")).toBeInstanceOf(Array);
          expect(serviceMap.getAll("anyKey")).toHaveLength(0);
        });
        test("should set a key with a value and get the last value", () => {
          serviceMap.set("anyKey", registration);
          expect(serviceMap.has("anyKey")).toBe(true);
          expect(serviceMap.get("anyKey")).toBe(registration);
          expect(serviceMap.get("anyKey").providerType).toBe(0);
          serviceMap.set("anyKey", registration2);
          expect(serviceMap.get("anyKey").providerType).toBe(1);
        });
        test("should setAll registrations to one key an return them", () => {
          serviceMap.setAll("anyKey", [registration, registration2]);
          expect(serviceMap.getAll("anyKey")).toEqual([
            registration,
            registration2,
          ]);
          expect(serviceMap.getAll("anyKey")).toHaveLength(2);
          expect(serviceMap.getAll("anyKey")[0].providerType).toBe(0);
          expect(serviceMap.getAll("anyKey")[1].providerType).toBe(1);
        });
        test("should list the entries of the map", () => {
          let countKeys = 0;
          let countValues = 0;
          serviceMap.setAll("anyKey", [registration, registration2]);
          serviceMap.setAll("anyKey2", [registration, registration2]);
          for (const value of serviceMap.values()) {
            countKeys++;
            countValues += value.length;
          }
          expect(countKeys).toBe(2);
          expect(countValues).toBe(4);
        });
        test("should delete one registration from the map", async () => {
          serviceMap.setAll("anyKey", [registration, registration2]);
          await serviceMap.delete("anyKey", registration);
          expect(serviceMap.getAll("anyKey")).toHaveLength(1);
        });
        test("should dispose and asyncDispose instances on delete", async () => {
          serviceMap.set("anyKey", registration);
          serviceMap.set("anyKey2", registration2);
          class TestDisposable implements Disposable {
            disposed = false;
            [Symbol.dispose](): void {
              this.disposed = true;
            }
          }
          class TestAsyncDisposable implements AsyncDisposable {
            disposed = false;
            async [Symbol.asyncDispose](): Promise<void> {
              this.disposed = true;
            }
          }
          serviceMap.get("anyKey").instance = new TestDisposable();
          serviceMap.get("anyKey2").instance = new TestAsyncDisposable();
          expect(registration.instance).toBeInstanceOf(TestDisposable);
          expect(registration2.instance).toBeInstanceOf(TestAsyncDisposable);

          await serviceMap.delete("anyKey", registration);
          await serviceMap.delete("anyKey2", registration2);

          expect(registration.instance.disposed).toBe(true);
          expect(registration2.instance.disposed).toBe(true);
        });
        test("should clear all entries", () => {
          serviceMap.setAll("anyKey", [registration, registration2]);
          serviceMap.clear();
          expect(Array.from(serviceMap.entries())).toHaveLength(0);
        });
        test("should dispose and asyncDispose instances", async () => {
          serviceMap.set("anyKey", registration);
          serviceMap.set("anyKey2", registration2);
          class TestDisposable implements Disposable {
            disposed = false;
            [Symbol.dispose](): void {
              this.disposed = true;
            }
          }
          class TestAsyncDisposable implements AsyncDisposable {
            disposed = false;
            async [Symbol.asyncDispose](): Promise<void> {
              this.disposed = true;
            }
          }
          serviceMap.get("anyKey").instance = new TestDisposable();
          serviceMap.get("anyKey2").instance = new TestAsyncDisposable();
          expect(registration.instance).toBeInstanceOf(TestDisposable);
          expect(registration2.instance).toBeInstanceOf(TestAsyncDisposable);

          await serviceMap[Symbol.asyncDispose]();

          expect(registration.instance.disposed).toBe(true);
          expect(registration2.instance.disposed).toBe(true);
        });
      });
    });
    describe("Container", () => {
      beforeEach(async () => container.reset());
      test("Should register an instance", () => {
        container.registerInstance("anyToken", 4);
        expect(container.resolve("anyToken")).toBe(4);
      });
      test("registerType should throw when tokenProvider to not found", () => {
        expect(() =>
          container.registerType("anyKey", { useToken: "anyToken" }),
        ).toThrow(TokenNotFoundError);
      });
      test("removeRegistration should throw when token not found", () => {
        expect(container.removeRegistration("anyKey")).rejects.toThrow(
          TokenNotFoundError,
        );
      });
    });
    describe("README", () => {
      test("test service", () => {
        class TestService {
          printMessage() {
            return "I'm printting this message inside of TestService instance.";
          }
        }

        @Singleton([TestService])
        class Test {
          constructor(public testService: TestService) {}
        }

        const testInstance = container.resolve(Test);
        expect(testInstance.testService.printMessage()).toBe(
          "I'm printting this message inside of TestService instance.",
        );
      });
    });
  });
});
