import { describe, expect, test } from "@jest/globals";
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

describe("Provider", () => {
  describe("Invalid provider", () => {
    test("isProvider", () => {
      expect(isProvider("test")).toBe(false);
    });
    test("getProviderType", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => getProviderType("test" as any)).toThrow(
        "Invalid provider type: test",
      );
    });
  });
  describe("ValueProvider", () => {
    test("isProvider", () => {
      expect(isProvider({ useValue: "test" })).toBe(true);
    });
    test("getProviderType", () => {
      expect(getProviderType({ useValue: "test" })).toBe(
        ProvidersType.ValueProvider,
      );
    });
    test("isValueProvider true", () => {
      expect(isValueProvider({ useValue: "test" })).toBe(true);
    });
    test("isValueProvider false", () => {
      expect(isValueProvider({} as Provider<unknown>)).toBe(false);
    });
  });
  describe("ClassProvider", () => {
    class TestClass {}
    test("isProvider", () => {
      expect(isProvider({ useClass: TestClass })).toBe(true);
    });
    test("getProviderType", () => {
      expect(getProviderType({ useClass: TestClass })).toBe(
        ProvidersType.ClassProvider,
      );
    });
    test("isClassProvider true", () => {
      expect(isClassProvider({ useClass: TestClass })).toBe(true);
    });
    test("isClassProvider false", () => {
      expect(isClassProvider({} as Provider<unknown>)).toBe(false);
    });
  });
  describe("Factory provider", () => {
    test("isProvider", () => {
      expect(isProvider({ useFactory: () => {} })).toBe(true);
    });
    test("getProviderType", () => {
      expect(getProviderType({ useFactory: () => {} })).toBe(
        ProvidersType.FactoryProvider,
      );
    });
    test("isFactoryProvider true", () => {
      expect(isFactoryProvider({ useFactory: () => {} })).toBe(true);
    });
    test("isFactoryProvider false", () => {
      expect(isFactoryProvider({} as Provider<unknown>)).toBe(false);
    });
  });
  describe("constructor provider", () => {
    test("isConstructorToken", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isConstructorType((() => true) as any)).toBe(true);
    });
    test("getProviderType", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getProviderType((() => true) as any)).toBe(
        ProvidersType.ConstructorProvider,
      );
    });
  });
  describe("Token provider", () => {
    test("isProvider", () => {
      expect(isProvider({ useToken: "test" })).toBe(true);
    });
    test("getProviderType", () => {
      expect(getProviderType({ useToken: "test" })).toBe(
        ProvidersType.TokenProvider,
      );
    });
    test("isTokenProvider true", () => {
      expect(isTokenProvider({ useToken: "test" })).toBe(true);
    });
    test("isTokenProvider false", () => {
      expect(isTokenProvider({} as Provider<unknown>)).toBe(false);
    });
    test("should throw circular token registration", async () => {
      await container.reset();
      container.register("test", { useToken: "test2" });
      expect(() => container.register("test2", { useToken: "test" })).toThrow(
        TokenRegistrationCycleError,
      );
    });
  });
});
