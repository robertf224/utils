import { describe, expect, test } from "vitest";
import { Hlc } from "@bobbyfidz/hlc";
import {
    applyDiff,
    createEmpty,
    deriveVersionVector,
    makeDiff,
    setAtPath,
    encodeDiff,
    decodeDiff,
    removeAtPath,
    vvCompareCoverage,
} from "./index.js";

describe("compact-crdt", () => {
    test("register set diff/apply roundtrip (add-wins)", () => {
        const nodeA = Hlc.create("A", 0);
        const nodeB = Hlc.create("B", 0);

        const docA = createEmpty(
            "A",
            Hlc.tick(nodeA, () => 1)
        );
        setAtPath(
            docA,
            ["user", "name"],
            "Alice",
            Hlc.tick(nodeA, () => 2)
        );
        const vvA1 = deriveVersionVector(docA);

        const docB = createEmpty(
            "B",
            Hlc.tick(nodeB, () => 1)
        );
        const diffToB = makeDiff(docA, deriveVersionVector(docB));
        const recv = decodeDiff(encodeDiff(diffToB));
        applyDiff(docB, recv);

        // After one-way sync, B's VV should cover A's (B has additional root dot from its own actor)
        expect(vvCompareCoverage(deriveVersionVector(docB), deriveVersionVector(docA))).toBe("covers");

        // Concurrent: B removes parent, A sets nested again -> add should win if newer than remove summary seen
        // simulate remove by recording vv
        const vvB = deriveVersionVector(docB);
        removeAtPath(docB, ["user"], vvB);

        setAtPath(
            docA,
            ["user", "name"],
            "Alice Cooper",
            Hlc.tick(nodeA, () => 3)
        );
        const diff2 = makeDiff(docA, deriveVersionVector(docB));
        applyDiff(docB, diff2);

        // Expect B to accept the newer write
        const regB = (docB.entries["user"] as any).entries["name"] as any;
        expect(regB.value).toBe("Alice Cooper");
    });
});
