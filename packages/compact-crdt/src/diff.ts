import { Hlc } from "@bobbyfidz/hlc";
import { deriveVersionVector } from "./Map.js";
import { VersionVector as VV } from "./VersionVector.js";
import type { DocumentRoot, Map, MapEntry } from "./Map.js";
import type { Register as RegisterLeaf } from "./Register.js";
import type { VersionVector } from "./VersionVector.js";

export type DiffOp =
    | {
          op: "set_register";
          path: string[]; // keys from root to leaf
          value: unknown;
          write: Hlc; // leaf write dot
          // Along the path, node dots that are not covered by the remote vv
          // are implicit by the existence of this op; receivers update node dots
      }
    | {
          op: "remove_key";
          path: string[]; // path to parent map
          key: string; // key removed
          removeVV: VersionVector; // summary at remove time
      };

export interface DiffEnvelope {
    // Summary of all ops, optional but helps recipients skip work
    vv: VersionVector;
    ops: DiffOp[];
}

function walkForDiff(node: Map, path: string[], remoteVV: VersionVector, ops: DiffOp[]): void {
    // If node's dots are all seen by remote, skip whole subtree
    let allSeen = true;
    for (const dot of Object.values(node.dots)) {
        if (!VV.contains(remoteVV, dot)) {
            allSeen = false;
            break;
        }
    }
    if (allSeen) return;

    // Dive into entries
    for (const [key, raw] of Object.entries(node.entries)) {
        const entry = raw as MapEntry;
        if (entry.type === "register") {
            const reg = entry as RegisterLeaf;
            if (!VV.contains(remoteVV, reg.dot)) {
                ops.push({ op: "set_register", path: [...path, key], value: reg.value, write: reg.dot });
            }
        } else {
            walkForDiff(entry as Map, [...path, key], remoteVV, ops);
        }
    }

    // Emit per-key removes when tombstones not seen by remote
    if (node.tombstones) {
        for (const [key, vv] of Object.entries(node.tombstones)) {
            let unseen = false;
            for (const dot of Object.values(vv)) {
                if (!VV.contains(remoteVV, dot)) {
                    unseen = true;
                    break;
                }
            }
            if (unseen) {
                ops.push({ op: "remove_key", path, key, removeVV: vv });
            }
        }
    }
}

export function makeDiff(local: DocumentRoot, remoteVV: VersionVector): DiffEnvelope {
    const ops: DiffOp[] = [];
    walkForDiff(local, [], remoteVV, ops);
    return { vv: deriveVersionVector(local), ops };
}

export function applyDiff(doc: DocumentRoot, diff: DiffEnvelope): DocumentRoot {
    // Simple interpreter: set_register overwrites by LWW if newer; remove_key applies remove summary
    for (const op of diff.ops) {
        if (op.op === "set_register") {
            // Walk/create parents
            let node: Map = doc;
            const path = op.path.slice(0, -1);
            for (const key of path) {
                const candidate = node.entries[key];
                if (!candidate || candidate.type !== "map") {
                    const created: Map = { type: "map", dots: {}, entries: {} };
                    node.entries[key] = created;
                    node = created;
                } else {
                    node = candidate;
                }
                node.dots = VV.mergeDot(node.dots, op.write);
            }
            const leafKey = op.path[op.path.length - 1]!;
            const existing = node.entries[leafKey];
            // Add-wins: only suppress if key's tombstone covers write
            if (
                node.tombstones &&
                node.tombstones[leafKey] &&
                VV.contains(node.tombstones[leafKey], op.write)
            ) {
                continue;
            }
            if (!existing || existing.type !== "register") {
                node.entries[leafKey] = {
                    type: "register",
                    value: op.value,
                    dot: op.write,
                } as RegisterLeaf;
            } else {
                const reg = existing as RegisterLeaf;
                if (Hlc.compare(op.write, reg.dot) >= 0) {
                    reg.value = op.value as unknown;
                    reg.dot = op.write;
                }
            }
        } else if (op.op === "remove_key") {
            let node: Map = doc;
            for (const key of op.path) {
                const child = node.entries[key];
                if (!child || child.type !== "map") break;
                node = child;
            }
            node.tombstones = node.tombstones ?? {};
            node.tombstones[op.key] = VV.merge(node.tombstones[op.key] ?? {}, op.removeVV);
            delete node.entries[op.key];
        }
    }
    return doc;
}
