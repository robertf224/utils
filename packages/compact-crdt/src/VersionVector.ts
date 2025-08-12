import { Hlc } from "@bobbyfidz/hlc";

// A version vector stores the latest HLC seen by each peer.
export type VersionVector = Record<string, Hlc>;

function contains(a: VersionVector, dot: Hlc): boolean {
    const aDot = a[dot.nodeId];
    if (!aDot) return false;
    return Hlc.compare(aDot, dot) >= 0;
}

function compare(a: VersionVector, b: VersionVector): number | undefined {
    const peerIds = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    let aHasGreaterDot = false;
    let bHasGreaterDot = false;
    for (const peerId of peerIds) {
        if (!a[peerId] && b[peerId]) {
            bHasGreaterDot = true;
        } else if (a[peerId] && !b[peerId]) {
            aHasGreaterDot = true;
        } else if (a[peerId] && b[peerId]) {
            const comparison = Hlc.compare(a[peerId], b[peerId]);
            if (comparison > 0) {
                aHasGreaterDot = true;
            } else if (comparison < 0) {
                bHasGreaterDot = true;
            }
        }
    }
    if (aHasGreaterDot && bHasGreaterDot) return undefined;
    if (aHasGreaterDot) return 1;
    if (bHasGreaterDot) return -1;
    return 0;
}

function merge(a: VersionVector, b: VersionVector): VersionVector {
    const out: VersionVector = { ...a };
    for (const [peerId, dot] of Object.entries(b)) {
        const prev = out[peerId];
        if (!prev || Hlc.compare(dot, prev) > 0) out[peerId] = dot;
    }
    return out;
}

function mergeDot(into: VersionVector, dot: Hlc): VersionVector {
    const prev = into[dot.nodeId];
    if (!prev || Hlc.compare(dot, prev) > 0) return { ...into, [dot.nodeId]: dot };
    return into;
}

export const VersionVector = { contains, compare, merge, mergeDot };
