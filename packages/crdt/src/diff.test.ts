import { Hlc } from "@bobbyfidz/hlc";
import { describe, expect, test } from "vitest";
import { applyDiff, diff } from "./diff.js";
import { Map } from "./Map.js";

describe("diff", () => {
    test("register set diff/apply roundtrip (add-wins)", () => {
        let a = Hlc.create("A", 0);
        let b = Hlc.create("B", 0);

        const docA = Map.create();
        a = Hlc.tick(a, () => 1);
        Map.setAtPath(docA, ["user", "name"], "Alice", a);

        const docB = Map.create();
        const diffToB = diff(docA, Map.getVersionVector(docB));
        applyDiff(docB, diffToB);

        // After one-way sync, both should materialize the same
        expect(Map.materialize(docB)).toEqual(Map.materialize(docA));

        // Concurrent: B removes parent, A sets nested again -> add should win if newer than remove summary seen
        b = Hlc.tick(b, () => 2);
        Map.removeAtPath(docB, ["user"], b);

        a = Hlc.tick(a, () => 3);
        Map.setAtPath(docA, ["user", "name"], "Alice Cooper", a);
        const diff2 = diff(docA, Map.getVersionVector(docB));
        applyDiff(docB, diff2);

        const out = Map.materialize(docB) as { user?: { name?: string } };
        expect(out.user?.name).toBe("Alice Cooper");
    });

    test("remove at deep path is propagated and later add wins", () => {
        let a = Hlc.create("A", 0);
        let b = Hlc.create("B", 0);

        const docA = Map.create();
        a = Hlc.tick(a, () => 1);
        Map.setAtPath(docA, ["root", "child", "leaf"], 1, a);

        const docB = Map.create();
        applyDiff(docB, diff(docA, Map.getVersionVector(docB)));
        b = Hlc.tick(b, () => 2);
        Map.removeAtPath(docB, ["root", "child", "leaf"], b);

        // A writes later
        a = Hlc.tick(a, () => 3);
        Map.setAtPath(docA, ["root", "child", "leaf"], 2, a);
        applyDiff(docB, diff(docA, Map.getVersionVector(docB)));

        const out = Map.materialize(docB) as { root?: { child?: { leaf?: number } } };
        expect(out.root?.child?.leaf).toBe(2);
    });

    test("multiple branches: only unseen ops emitted", () => {
        let a = Hlc.create("A", 0);
        const docA = Map.create();
        a = Hlc.tick(a, () => 1);
        Map.setAtPath(docA, ["a", "x"], 1, a);
        a = Hlc.tick(a, () => 2);
        Map.setAtPath(docA, ["b", "y"], 2, a);

        const docB = Map.create();
        // Diff from A to empty B
        const ops1 = diff(docA, Map.getVersionVector(docB));
        // Apply only the op for a/x to simulate partial sync
        const onlyAX = ops1.filter((o) => o.op === "set" && o.path.join("/") === "a/x");
        applyDiff(docB, onlyAX);

        // Now B is up-to-date with a/x, but not with b/y
        const ops2 = diff(docA, Map.getVersionVector(docB));
        // Expect only one op that sets b/y
        const setOps = ops2.filter((o) => o.op === "set");
        expect(setOps).toHaveLength(1);
        expect(setOps[0]!.path.join("/")).toBe("b/y");
    });
});
