import { Hlc } from "@bobbyfidz/hlc";
import { describe, expect, test } from "vitest";
import { VersionVector } from "./VersionVector.js";

describe("VersionVector", () => {
    test("contains: missing actor and older dot are not contained; equal/newer are contained", () => {
        const a0 = Hlc.create("A", 0);
        const a1 = Hlc.tick(a0, () => 1);
        const a2 = Hlc.tick(a1, () => 2);

        // empty vector does not contain anything
        expect(VersionVector.contains({}, a1)).toBe(false);

        // older stored dot does not contain newer
        const vvOld = { A: a1 };
        expect(VersionVector.contains(vvOld, a2)).toBe(false);

        // equal and newer stored dot contain older/equal
        const vvNew = { A: a2 };
        expect(VersionVector.contains(vvNew, a1)).toBe(true);
        expect(VersionVector.contains(vvNew, a2)).toBe(true);

        // also via namespaced export
        expect(VersionVector.contains(vvNew, a1)).toBe(true);
    });

    test("compare: equal, dominates, and concurrent cases", () => {
        const a0 = Hlc.create("A", 0);
        const a1 = Hlc.tick(a0, () => 1);
        const a2 = Hlc.tick(a1, () => 2);

        const b0 = Hlc.create("B", 0);
        const b1 = Hlc.tick(b0, () => 1);
        const b2 = Hlc.tick(b1, () => 2);

        // equal
        expect(VersionVector.compare({ A: a1 }, { A: a1 })).toBe(0);

        // a dominates b (same actor newer)
        expect(VersionVector.compare({ A: a2 }, { A: a1 })).toBe(1);

        // b dominates a (missing actor in a)
        expect(VersionVector.compare({}, { A: a1 })).toBe(-1);

        // presence alone can dominate
        expect(VersionVector.compare({ A: a1 }, {})).toBe(1);

        // concurrent/incomparable: a newer on A, b newer on B
        expect(VersionVector.compare({ A: a2, B: b1 }, { A: a1, B: b2 })).toBeUndefined();
    });

    test("merge: takes maxima per actor and unions keys", () => {
        const a0 = Hlc.create("A", 0);
        const a1 = Hlc.tick(a0, () => 1);
        const a2 = Hlc.tick(a1, () => 2);

        const b0 = Hlc.create("B", 0);
        const b1 = Hlc.tick(b0, () => 1);

        const left = { A: a1 } as const;
        const right = { A: a2, B: b1 } as const;

        const out = VersionVector.merge(left, right);
        expect(out).toEqual({ A: a2, B: b1 });

        // inputs not mutated
        expect(left).toEqual({ A: a1 });
        expect(right).toEqual({ A: a2, B: b1 });

        // alias export produces same result
        const outAlias = VersionVector.merge(left, right);
        expect(outAlias).toEqual(out);
    });

    test("mergeDot: updates only when newer and preserves reference when unchanged", () => {
        const a0 = Hlc.create("A", 0);
        const a1 = Hlc.tick(a0, () => 1);
        const a2 = Hlc.tick(a1, () => 2);

        const vv1 = {} as Record<string, ReturnType<typeof Hlc.create>>;
        const vv2 = VersionVector.mergeDot(vv1, a1);
        expect(vv2).not.toBe(vv1);
        expect(vv2).toEqual({ A: a1 });

        // newer dot returns new object with update
        const vv3 = VersionVector.mergeDot(vv2, a2);
        expect(vv3).not.toBe(vv2);
        expect(vv3).toEqual({ A: a2 });

        // older/equal dot returns same reference
        const vv4 = VersionVector.mergeDot(vv3, a1);
        expect(vv4).toBe(vv3);
        const vv5 = VersionVector.mergeDot(vv3, a2);
        expect(vv5).toBe(vv3);

        // also via namespaced export
        const vv6 = VersionVector.mergeDot(vv3, a2);
        expect(vv6).toBe(vv3);
    });
});
