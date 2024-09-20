import { afterEach, describe, expect, test } from "@jest/globals";
import { container } from "../../../src/di/container";

describe("more tests", () => {
    afterEach(() => {
        container.reset();
    });

    test("child container resolves even when parent doesn't have registration", () => {
        interface IFoo {}
        class Foo implements IFoo {}

        const child = container.createChildContainer();
        child.register("IFoo", { useClass: Foo });

        const myFoo = child.resolve<Foo>("IFoo");

        expect(myFoo instanceof Foo).toBeTruthy();
    });

    test("child container resolves using parent's registration when child container doesn't have registration", () => {
        interface IFoo {}
        class Foo implements IFoo {}

        container.register("IFoo", { useClass: Foo });
        const child = container.createChildContainer();

        const myFoo = child.resolve<Foo>("IFoo");

        expect(myFoo instanceof Foo).toBeTruthy();
    });

    test("child container resolves all even when parent doesn't have registration", () => {
        interface IFoo {}
        class Foo implements IFoo {}

        const child = container.createChildContainer();
        container.register("IFoo", { useClass: Foo });

        const myFoo = child.resolveAll<IFoo>("IFoo");

        expect(Array.isArray(myFoo)).toBeTruthy();
        expect(myFoo.length).toBe(1);
        expect(myFoo[0] instanceof Foo).toBeTruthy();
    });

    test("child container resolves all using parent's registration when child container doesn't have registration", () => {
        interface IFoo {}
        class Foo implements IFoo {}

        container.register("IFoo", { useClass: Foo });
        const child = container.createChildContainer();

        const myFoo = child.resolveAll<IFoo>("IFoo");

        expect(Array.isArray(myFoo)).toBeTruthy();
        expect(myFoo.length).toBe(1);
        expect(myFoo[0] instanceof Foo).toBeTruthy();
    });
});
