import { beforeEach, describe, expect, test } from "@jest/globals";
import { container } from "../../src/di/container";

describe("Averix - DI", () => {
    beforeEach(() => {
        container.clear();
    });
    describe("static inject", () => {
        describe("register and resolve", () => {
            test("should register and resolve a value", () => {
                const value = "test";
                container.register("value", value);
                expect(container.resolve("value")).toBe(value);
            });
        });
    });
});
