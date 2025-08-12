import { describe, expect, test } from "vitest";
import { Hlc } from "@bobbyfidz/hlc";
import {
    createEmpty,
    setAtPath,
    makeDiff,
    deriveVersionVector,
    encodeDocument,
    decodeDocument,
    encodeVersionVector,
    decodeVersionVector,
    encodeDiff,
    decodeDiff,
} from "./index.js";

describe("encoding", () => {
    test("document + diff + vv roundtrip via CBOR", () => {
        const a = Hlc.create("A", 0);
        const doc = createEmpty("A", a);
        setAtPath(doc, ["x"], 42, a);

        const encDoc = encodeDocument(doc);
        const decDoc = decodeDocument(encDoc);
        expect(decDoc.type).toBe("map");

        const vv = deriveVersionVector(doc);
        const encVV = encodeVersionVector(vv);
        const decVV = decodeVersionVector(encVV);
        expect(Object.keys(decVV).length).toBeGreaterThan(0);

        const diff = makeDiff(doc, {});
        const encDiff = encodeDiff(diff);
        const decDiff = decodeDiff(encDiff);
        expect(decDiff.ops.length).toBeGreaterThan(0);
    });
});
