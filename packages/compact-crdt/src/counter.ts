import type { Hlc as HlcType } from "@bobbyfidz/hlc";
import { mergeDot } from "./VersionVector.js";
import type { CounterLeaf, ActorId } from "./types.js";
import type { VersionVector } from "./VersionVector.js";

export function createCounter(initial: number, actor: ActorId, dot: HlcType): CounterLeaf {
    const p: Record<ActorId, number> = {};
    const n: Record<ActorId, number> = {};
    if (initial >= 0) p[actor] = initial;
    else n[actor] = -initial;
    const actorDots: VersionVector = { [actor]: { ...dot } };
    const dots: VersionVector = { [actor]: { ...dot } };
    return { type: "counter", p, n, actorDots, dots };
}

export function valueOfCounter(counter: CounterLeaf): number {
    const pos = Object.values(counter.p).reduce((a, b) => a + b, 0);
    const neg = Object.values(counter.n).reduce((a, b) => a + b, 0);
    return pos - neg;
}

export function addToCounter(
    counter: CounterLeaf,
    actor: ActorId,
    amount: number,
    dot: HlcType
): CounterLeaf {
    const next: CounterLeaf = {
        type: "counter",
        p: { ...counter.p },
        n: { ...counter.n },
        actorDots: { ...counter.actorDots },
        dots: { ...counter.dots },
    };
    if (amount >= 0) next.p[actor] = (next.p[actor] ?? 0) + amount;
    else next.n[actor] = (next.n[actor] ?? 0) + -amount;
    next.actorDots[actor] = { ...dot };
    mergeDot(next.dots, dot);
    return next;
}
