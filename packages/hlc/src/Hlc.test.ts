import { describe, expect, test } from "vitest";
import { Hlc } from "./index.js";

describe("HLC", () => {
    test("tick generates increasing counters within same timestamp", () => {
        let state = Hlc.create("nodeA", 0);

        state = Hlc.tick(state, () => 1_000);
        const ts1: Hlc = state;
        expect(ts1.timestamp).toBe(1_000);
        expect(ts1.counter).toBe(0);

        state = Hlc.tick(state, () => 1_000);
        const ts2: Hlc = state;
        expect(ts2.timestamp).toBe(1_000);
        expect(ts2.counter).toBe(ts1.counter + 1);

        const ts3 = Hlc.tick(state, () => 1_001);
        expect(ts3.timestamp).toBe(1_001);
        expect(ts3.counter).toBe(0);
    });

    test("merge remote ahead of local", () => {
        let state = Hlc.create("nodeB", 0);

        state = Hlc.tick(state, () => 100);

        const remote: Hlc = { timestamp: 200, counter: 3, actorId: "remote" };
        const ts = Hlc.merge(state, remote, () => 150);
        const newState = ts;

        expect(ts.timestamp).toBe(100);
        expect(ts.counter).toBe(4);
        expect(newState.timestamp).toBe(100);
        expect(newState.counter).toBe(4);
    });

    test("merge with stale remote at same timestamp increments local counter", () => {
        let state = Hlc.create("nodeC", 0);
        state = Hlc.tick(state, () => 500);
        state = Hlc.tick(state, () => 500); // counter becomes 1

        const remote: Hlc = { timestamp: 500, counter: 0, actorId: "r" };
        const ts = Hlc.merge(state, remote, () => 500);
        const newState = ts;
        expect(ts.timestamp).toBe(500);
        expect(ts.counter).toBe(2); // max(1,0)+1
        expect(newState.counter).toBe(2);
    });

    test("compare provides total ordering with actorId as tie-breaker", () => {
        const a: Hlc = { timestamp: 10, counter: 0, actorId: "A" };
        const b: Hlc = { timestamp: 10, counter: 0, actorId: "B" };
        expect(Math.sign(Hlc.compare(a, b))).toBe(-1);
        expect(Math.sign(Hlc.compare(b, a))).toBe(1);
        expect(Math.sign(Hlc.compare(a, a))).toBe(0);
    });

    test("string encode/parse roundtrip is lossless and safe for ids with separators", () => {
        const ts: Hlc = { timestamp: 123, counter: 4, actorId: "node:id/with?chars-α" };
        const encoded = Hlc.toString(ts);
        const decoded = Hlc.parse(encoded);
        expect(decoded).toEqual(ts);
    });
});
