import { beforeEach, describe, test } from "node:test";
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
import * as assert from "node:assert/strict";

describe("Dymexjs_DI ", () => {
  describe("Other", () => {
    describe("Decorators - InvalidDecoratorError", () => {
      test("Singleton", () => {
        assert.throws(
          () =>
            class Test {
              //@ts-expect-error  This should throw because the decorator is invalid here
              @Singleton("test")
              prop: number = 1;
            },
          InvalidDecoratorError,
        );
      });
      test("Transient", () => {
        assert.throws(
          () =>
            class Test {
              //@ts-expect-error  This should throw because the decorator is invalid here
              @Transient("test")
              prop: number = 1;
            },
          InvalidDecoratorError,
        );
      });
      test("Scoped", () => {
        assert.throws(
          () =>
            class Test {
              //@ts-expect-error  This should throw because the decorator is invalid here
              @Scoped("test")
              prop: number = 1;
            },
          InvalidDecoratorError,
        );
      });
      test("AutoInjectable", () => {
        assert.throws(
          () =>
            class Test {
              //@ts-expect-error  This should throw because the decorator is invalid here
              @AutoInjectable()
              prop: number = 1;
            },
          InvalidDecoratorError,
        );
      });
    });
    describe("ServiceMap", () => {
      test("should create a ServiceMapInstance that implements AsyncDisposable", () => {
        const serviceMap = new ServiceMap();
        assert.ok(serviceMap instanceof ServiceMap);
        assert.ok(serviceMap[Symbol.asyncDispose] instanceof Function);
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
          assert.ok(Array.isArray(serviceMap.getAll("anyKey")));
          assert.strictEqual(serviceMap.getAll("anyKey").length, 0);
        });
        test("should set a key with a value and get the last value", () => {
          serviceMap.set("anyKey", registration);
          assert.ok(serviceMap.has("anyKey"));
          assert.strictEqual(serviceMap.get("anyKey"), registration);
          assert.strictEqual(serviceMap.get("anyKey").providerType, 0);
          serviceMap.set("anyKey", registration2);
          assert.strictEqual(serviceMap.get("anyKey").providerType, 1);
        });
        test("should setAll registrations to one key an return them", () => {
          serviceMap.setAll("anyKey", [registration, registration2]);
          assert.deepEqual(serviceMap.getAll("anyKey"), [
            registration,
            registration2,
          ]);
          assert.strictEqual(serviceMap.getAll("anyKey").length, 2);
          assert.strictEqual(serviceMap.getAll("anyKey")[0].providerType, 0);
          assert.strictEqual(serviceMap.getAll("anyKey")[1].providerType, 1);
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
          assert.strictEqual(countKeys, 2);
          assert.strictEqual(countValues, 4);
        });
        test("should delete one registration from the map", async () => {
          serviceMap.setAll("anyKey", [registration, registration2]);
          await serviceMap.delete("anyKey", registration);
          assert.strictEqual(serviceMap.getAll("anyKey").length, 1);
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
          assert.ok(registration.instance instanceof TestDisposable);
          assert.ok(registration2.instance instanceof TestAsyncDisposable);

          await serviceMap.delete("anyKey", registration);
          await serviceMap.delete("anyKey2", registration2);

          assert.strictEqual(registration.instance.disposed, true);
          assert.strictEqual(registration2.instance.disposed, true);
        });
        test("should clear all entries", () => {
          serviceMap.setAll("anyKey", [registration, registration2]);
          serviceMap.clear();
          assert.strictEqual(Array.from(serviceMap.entries()).length, 0);
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
          assert.ok(registration.instance instanceof TestDisposable);
          assert.ok(registration2.instance instanceof TestAsyncDisposable);

          await serviceMap[Symbol.asyncDispose]();

          assert.strictEqual(registration.instance.disposed, true);
          assert.strictEqual(registration2.instance.disposed, true);
        });
      });
    });
    describe("Container", () => {
      beforeEach(async () => container.reset());
      test("Should register an instance", () => {
        container.registerInstance("anyToken", 4);
        assert.strictEqual(container.resolve("anyToken"), 4);
      });
      test("registerType should throw when tokenProvider to not found", () => {
        assert.throws(
          () => container.registerType("anyKey", { useToken: "anyToken" }),
          TokenNotFoundError,
        );
      });
      test("removeRegistration should throw when token not found", () => {
        assert.rejects(
          container.removeRegistration("anyKey"),
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
        assert.strictEqual(
          testInstance.testService.printMessage(),
          "I'm printting this message inside of TestService instance.",
        );
      });
    });
  });
});
