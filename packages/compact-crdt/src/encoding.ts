import { encode as cborEncode, decode as cborDecode } from "cborg";
import type { DiffEnvelope, DocumentRoot, VersionVector } from "./types.js";

export function encodeVersionVector(vv: VersionVector): Uint8Array {
    // Represent as array of [nodeId, timestamp, counter]
    const arr = Object.entries(vv).map(([id, dot]) => [id, dot.timestamp, dot.counter]);
    return cborEncode(arr);
}

export function decodeVersionVector(data: Uint8Array): VersionVector {
    const arr = cborDecode(data) as [string, number, number][];
    const vv: VersionVector = {};
    for (const [id, t, c] of arr) vv[id] = { timestamp: t, counter: c, nodeId: id };
    return vv;
}

export function encodeDocument(doc: DocumentRoot): Uint8Array {
    return cborEncode(doc);
}

export function decodeDocument(data: Uint8Array): DocumentRoot {
    return cborDecode(data) as DocumentRoot;
}

export function encodeDiff(diff: DiffEnvelope): Uint8Array {
    return cborEncode(diff);
}

export function decodeDiff(data: Uint8Array): DiffEnvelope {
    return cborDecode(data) as DiffEnvelope;
}
