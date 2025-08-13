import { Hlc } from "@bobbyfidz/hlc";
import { Map } from "./Map.js";
import { VersionVector } from "./VersionVector.js";

export type DiffOp =
    | {
          op: "set";
          path: string[];
          value: unknown;
          dot: Hlc;
      }
    | {
          op: "remove";
          path: string[];
          versionVector: VersionVector;
      };

export function diff(map: Map, remoteVersionVector: VersionVector): DiffOp[] {
    const ops: DiffOp[] = [];

    function walk(node: Map, path: string[]): void {
        const nodeVersionVector = Map.getVersionVector(node);
        if (!VersionVector.isConcurrentOrAfter(nodeVersionVector, remoteVersionVector)) {
            return;
        }

        for (const [key, entry] of Object.entries(node.entries)) {
            if (entry.type === "register") {
                if (!VersionVector.contains(remoteVersionVector, entry.dot)) {
                    ops.push({ op: "set", path: [...path, key], value: entry.value, dot: entry.dot });
                }
            } else {
                walk(entry, [...path, key]);
            }
        }

        if (node.tombstones) {
            for (const [key, versionVector] of Object.entries(node.tombstones)) {
                if (VersionVector.isConcurrentOrAfter(versionVector, remoteVersionVector)) {
                    ops.push({ op: "remove", path: [...path, key], versionVector });
                }
            }
        }
    }

    walk(map, []);
    return ops;
}

export function applyDiff(doc: Map, diff: DiffOp[]): void {
    for (const op of diff) {
        if (op.op === "set") {
            Map.setAtPath(doc, op.path as [string, ...string[]], op.value, op.dot);
        } else if (op.op === "remove") {
            Map.removeAtPath(doc, op.path as [string, ...string[]], op.versionVector);
        }
    }
}
