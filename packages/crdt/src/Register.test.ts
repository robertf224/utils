import { Hlc } from "@bobbyfidz/hlc";
import { describe, expect, test } from "vitest";
import { Register } from "./Register.js";

describe("Register", () => {
    test("create sets value and dot", () => {
        const dot = Hlc.create("A", 0);
        const reg = Register.create("v1", dot);
        expect(reg.type).toBe("register");
        expect(reg.value).toBe("v1");
        expect(reg.dot).toEqual(dot);
    });

    test("set updates on newer dot", () => {
        let dot = Hlc.create("A", 0);
        dot = Hlc.tick(dot, () => 1000);
        let reg = Register.create("v1", dot);

        const newer = Hlc.tick(dot, () => 1001);
        reg = Register.set(reg, "v2", newer);
        expect(reg.value).toBe("v2");
        expect(reg.dot).toEqual(newer);

        const older = { timestamp: 999, counter: 0, actorId: "A" } as const;
        const reg2 = Register.set(reg, "v3", older);
        expect(reg2.value).toBe("v2");
        expect(reg2.dot).toEqual(newer);
    });

    test("tie-break with actorId when ts and counter equal", () => {
        const a = { timestamp: 1000, counter: 0, actorId: "A" } as const;
        const b = { timestamp: 1000, counter: 0, actorId: "B" } as const;
        let reg = Register.create("fromA", a);
        reg = Register.set(reg, "fromB", b);
        expect(reg.value).toBe("fromB");
        expect(reg.dot).toEqual(b);
    });
});
