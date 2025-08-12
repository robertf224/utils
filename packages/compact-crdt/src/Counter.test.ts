import { describe, expect, test } from "vitest";
import { Hlc } from "@bobbyfidz/hlc";
import {
    createEmpty,
    initCounterAtPath,
    addToCounterAtPath,
    makeDiff,
    applyDiff,
    deriveVersionVector,
    decodeDiff,
    encodeDiff,
    valueOfCounter,
} from "./index.js";

describe("counter", () => {
    test("pn-counter merges via diffs", () => {
        let a = Hlc.create("A", 0);
        let b = Hlc.create("B", 0);
        const docA = createEmpty(
            "A",
            Hlc.tick(a, () => 1)
        );
        const docB = createEmpty(
            "B",
            Hlc.tick(b, () => 1)
        );

        a = Hlc.tick(a, () => 2);
        initCounterAtPath(docA, ["ctr"], 0, a);
        a = Hlc.tick(a, () => 3);
        addToCounterAtPath(docA, ["ctr"], 5, a); // +5 by A

        b = Hlc.tick(b, () => 2);
        initCounterAtPath(docB, ["ctr"], 0, b);
        b = Hlc.tick(b, () => 3);
        addToCounterAtPath(docB, ["ctr"], -2, b); // -2 by B

        applyDiff(docB, decodeDiff(encodeDiff(makeDiff(docA, deriveVersionVector(docB)))));
        applyDiff(docA, decodeDiff(encodeDiff(makeDiff(docB, deriveVersionVector(docA)))));

        const ctrA = docA.entries["ctr"] as any;
        const ctrB = docB.entries["ctr"] as any;
        expect(valueOfCounter(ctrA)).toBe(3);
        expect(valueOfCounter(ctrB)).toBe(3);
    });
});
