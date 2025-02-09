import { describe, test } from "node:test";
import * as assert from "node:assert/strict";
import {
  type Provider,
  container,
  TokenRegistrationCycleError,
} from "../src/index.ts";
import { isConstructorType } from "../src/types/constructor.type.ts";
import {
  isProvider,
  getProviderType,
  ProvidersType,
  isValueProvider,
  isClassProvider,
  isFactoryProvider,
  isTokenProvider,
} from "../src/types/providers/index.ts";

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
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
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
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      assert.strictEqual(isProvider({ useFactory: () => {} }), true);
    });
    test("getProviderType", () => {
      assert.strictEqual(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        getProviderType({ useFactory: () => {} }),
        ProvidersType.FactoryProvider,
      );
    });
    test("isFactoryProvider true", () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
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
      await container.dispose();
      container.register("test", { useToken: "test2" });
      assert.throws(
        () => container.register("test2", { useToken: "test" }),
        TokenRegistrationCycleError,
      );
    });
  });
});
