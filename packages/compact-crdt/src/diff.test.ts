import { describe, expect, test } from "vitest";
import { Hlc } from "@bobbyfidz/hlc";
import { Map } from "./Map.js";
import { applyDiff, makeDiff } from "./diff.js";

describe("compact-crdt", () => {
    test("register set diff/apply roundtrip (add-wins)", () => {
        let a = Hlc.create("A", 0);
        let b = Hlc.create("B", 0);

        const docA = Map.create();
        a = Hlc.tick(a, () => 1);
        Map.setAtPath(docA, ["user", "name"], "Alice", a);

        const docB = Map.create();
        const diffToB = makeDiff(docA, Map.getVersionVector(docB));
        applyDiff(docB, diffToB);

        // After one-way sync, both should materialize the same
        expect(Map.materialize(docB)).toEqual(Map.materialize(docA));

        // Concurrent: B removes parent, A sets nested again -> add should win if newer than remove summary seen
        b = Hlc.tick(b, () => 2);
        Map.removeAtPath(docB, ["user"], b);

        a = Hlc.tick(a, () => 3);
        Map.setAtPath(docA, ["user", "name"], "Alice Cooper", a);
        const diff2 = makeDiff(docA, Map.getVersionVector(docB));
        applyDiff(docB, diff2);

        const out = Map.materialize(docB) as { user?: { name?: string } };
        expect(out.user?.name).toBe("Alice Cooper");
    });
});
