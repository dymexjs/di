import { describe, test } from "node:test";
import {
  getProviderType,
  isProvider,
  Provider,
  ProvidersType,
} from "../src/types/providers/provider.type";
import { isValueProvider } from "../src/types/providers/value-provider";
import { isClassProvider } from "../src/types/providers/class-provider";
import { isFactoryProvider } from "../src/types/providers/factory-provider";
import { isConstructorType } from "../src/types/constructor.type";
import { isTokenProvider } from "../src/types/providers/token-provider";
import { container } from "../src/container";
import { TokenRegistrationCycleError } from "../src/exceptions/TokenRegistrationCycleError";
import * as assert from "node:assert/strict";

describe("Provider", () => {
  describe("Invalid provider", () => {
    test("isProvider", () => {
      assert.strictEqual(isProvider("test"), false);
    });
    test("getProviderType", () => {
      assert.throws(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => getProviderType("test" as any),
        /Invalid provider type: test/,
      );
    });
  });
  describe("ValueProvider", () => {
    test("isProvider", () => {
      assert.ok(isProvider({ useValue: "test" }));
    });
    test("getProviderType", () => {
      assert.strictEqual(
        getProviderType({ useValue: "test" }),
        ProvidersType.ValueProvider,
      );
    });
    test("isValueProvider true", () => {
      assert.ok(isValueProvider({ useValue: "test" }));
    });
    test("isValueProvider false", () => {
      assert.strictEqual(isValueProvider({} as Provider<unknown>), false);
    });
  });
  describe("ClassProvider", () => {
    class TestClass {}
    test("isProvider", () => {
      assert.ok(isProvider({ useClass: TestClass }));
    });
    test("getProviderType", () => {
      assert.strictEqual(
        getProviderType({ useClass: TestClass }),
        ProvidersType.ClassProvider,
      );
    });
    test("isClassProvider true", () => {
      assert.ok(isClassProvider({ useClass: TestClass }));
    });
    test("isClassProvider false", () => {
      assert.strictEqual(isClassProvider({} as Provider<unknown>), false);
    });
  });
  describe("Factory provider", () => {
    test("isProvider", () => {
      assert.strictEqual(isProvider({ useFactory: () => {} }), true);
    });
    test("getProviderType", () => {
      assert.strictEqual(
        getProviderType({ useFactory: () => {} }),
        ProvidersType.FactoryProvider,
      );
    });
    test("isFactoryProvider true", () => {
      assert.strictEqual(isFactoryProvider({ useFactory: () => {} }), true);
    });
    test("isFactoryProvider false", () => {
      assert.strictEqual(isFactoryProvider({} as Provider<unknown>), false);
    });
  });
  describe("constructor provider", () => {
    test("isConstructorToken", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.strictEqual(isConstructorType((() => true) as any), true);
    });
    test("getProviderType", () => {
      assert.strictEqual(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getProviderType((() => true) as any),
        ProvidersType.ConstructorProvider,
      );
    });
  });
  describe("Token provider", () => {
    test("isProvider", () => {
      assert.strictEqual(isProvider({ useToken: "test" }), true);
    });
    test("getProviderType", () => {
      assert.strictEqual(
        getProviderType({ useToken: "test" }),
        ProvidersType.TokenProvider,
      );
    });
    test("isTokenProvider true", () => {
      assert.strictEqual(isTokenProvider({ useToken: "test" }), true);
    });
    test("isTokenProvider false", () => {
      assert.strictEqual(isTokenProvider({} as Provider<unknown>), false);
    });
    test("should throw circular token registration", async () => {
      await container.reset();
      container.register("test", { useToken: "test2" });
      assert.throws(
        () => container.register("test2", { useToken: "test" }),
        TokenRegistrationCycleError,
      );
    });
  });
});
