import { Hlc } from "@bobbyfidz/hlc";
import { Map } from "./Map.js";
import { VersionVector as VV } from "./VersionVector.js";
import type { Map as MapNode, MapEntry } from "./Map.js";
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

function walkForDiff(node: MapNode, path: string[], remoteVV: VersionVector, ops: DiffOp[]): void {
    // This simplified version has no per-node dots; prune using node materialized vv
    const hereVV = Map.getVersionVector(node);
    const cmp = VV.compare(hereVV, remoteVV);
    if (cmp !== undefined && cmp <= 0) {
        return;
    }

    for (const key in node.entries) {
        const entry = node.entries[key] as MapEntry;
        if (entry.type === "register") {
            if (!VV.contains(remoteVV, entry.dot)) {
                ops.push({ op: "set_register", path: [...path, key], value: entry.value, write: entry.dot });
            }
        } else {
            walkForDiff(entry, [...path, key], remoteVV, ops);
        }
    }

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

export function makeDiff(local: MapNode, remoteVV: VersionVector): DiffEnvelope {
    const ops: DiffOp[] = [];
    walkForDiff(local, [], remoteVV, ops);
    return { vv: Map.getVersionVector(local), ops };
}

export function applyDiff(doc: MapNode, diff: DiffEnvelope): MapNode {
    // Simple interpreter: set_register overwrites by LWW if newer; remove_key applies remove summary
    for (const op of diff.ops) {
        if (op.op === "set_register") {
            // Walk/create parents
            let node: MapNode = doc;
            const path = op.path.slice(0, -1);
            for (const key of path) {
                const candidate = node.entries[key];
                if (!candidate || candidate.type !== "map") {
                    const created: MapNode = Map.create();
                    node.entries[key] = created;
                    node = created;
                } else {
                    node = candidate;
                }
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
                };
            } else {
                if (Hlc.compare(op.write, existing.dot) >= 0) {
                    existing.value = op.value;
                    existing.dot = op.write;
                }
            }
        } else if (op.op === "remove_key") {
            let node: MapNode = doc;
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
