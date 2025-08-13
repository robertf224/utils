import { Hlc } from "@bobbyfidz/hlc";
import { describe, expect, test } from "vitest";
import { Map } from "./Map.js";

describe("add-wins removes", () => {
    test("new add after remove is accepted", () => {
        let a = Hlc.create("A", 0);
        let b = Hlc.create("B", 0);
        const doc = Map.create();

        a = Hlc.tick(a, () => 1);
        Map.setAtPath(doc, ["user", "name"], "Alice", a);

        b = Hlc.tick(b, () => 1);
        Map.removeAtPath(doc, ["user", "name"], b);

        a = Hlc.tick(a, () => 2);
        Map.setAtPath(doc, ["user", "name"], "Alice Cooper", a);

        const out = Map.materialize(doc) as { user?: { name?: string } };
        expect(out.user?.name).toBe("Alice Cooper");
    });

    test("remove individual key hides it from materialized view", () => {
        let a = Hlc.create("A", 0);
        let b = Hlc.create("B", 0);
        const doc = Map.create();

        a = Hlc.tick(a, () => 1);
        Map.setAtPath(doc, ["user", "name"], "Alice", a);

        b = Hlc.tick(b, () => 1);
        Map.removeAtPath(doc, ["user", "name"], b);

        const out = Map.materialize(doc) as { user?: { name?: string } };
        expect(out.user?.name).toBeUndefined();
    });
});
