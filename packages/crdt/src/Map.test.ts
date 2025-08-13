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

describe("Map materialize and tombstones", () => {
    test("nested deletes are respected but newer nested adds win", () => {
        let a = Hlc.create("A", 0);
        let b = Hlc.create("B", 0);
        const doc = Map.create();

        a = Hlc.tick(a, () => 1);
        Map.setAtPath(doc, ["user", "name"], "Alice", a);
        Map.setAtPath(doc, ["user", "age"], 30, a);

        b = Hlc.tick(b, () => 2);
        Map.removeAtPath(doc, ["user", "name"], b);

        // Concurrent write older than remove should be hidden
        const older = { ...a, timestamp: a.timestamp, counter: a.counter - 1 } as typeof a;
        Map.setAtPath(doc, ["user", "name"], "Old", older);

        // Newer write after remove should appear
        a = Hlc.tick(a, () => 3);
        Map.setAtPath(doc, ["user", "name"], "Alice Cooper", a);

        const out = Map.materialize(doc) as { user?: { name?: string; age?: number } };
        expect(out.user?.age).toBe(30);
        expect(out.user?.name).toBe("Alice Cooper");
    });

    test("sibling map preserved when one key removed", () => {
        let a = Hlc.create("A", 0);
        const doc = Map.create();
        a = Hlc.tick(a, () => 1);
        Map.setAtPath(doc, ["prefs", "theme"], "dark", a);
        Map.setAtPath(doc, ["prefs", "lang"], "en", a);

        Map.removeAtPath(doc, ["prefs", "lang"], a);
        const out = Map.materialize(doc) as { prefs?: { theme?: string; lang?: string } };
        expect(out.prefs?.theme).toBe("dark");
        expect(out.prefs?.lang).toBeUndefined();
    });
});
