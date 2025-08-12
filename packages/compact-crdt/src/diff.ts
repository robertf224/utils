import { Hlc } from "@bobbyfidz/hlc";
import type {
    DiffEnvelope,
    DiffOp,
    DocumentRoot,
    MapEntry,
    MapNode,
    RegisterLeaf,
    CounterLeaf,
} from "./types.js";
import type { VersionVector } from "./VersionVector.js";
import type { Hlc as HlcType } from "@bobbyfidz/hlc";
import { deriveVersionVector } from "./Map.js";
import { maxDot } from "./Register.js";
import { vvMerge, contains, mergeDot } from "./versionVector.js";

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
      }
    | {
          op: "counter_update";
          path: string[]; // keys from root to counter leaf
          actor: ActorId;
          p: number;
          n: number;
          dot: Hlc; // actor's latest counter dot
      };

export interface DiffEnvelope {
    // Summary of all ops, optional but helps recipients skip work
    vv: VersionVector;
    ops: DiffOp[];
}

function walkForDiff(node: MapNode, path: string[], remoteVV: VersionVector, ops: DiffOp[]): void {
    // If node's dots are all seen by remote, skip whole subtree
    let allSeen = true;
    for (const dot of Object.values(node.dots)) {
        if (!contains(remoteVV, dot)) {
            allSeen = false;
            break;
        }
    }
    if (allSeen) return;

    // Dive into entries
    for (const [key, entry] of Object.entries(node.entries)) {
        if (entry.type === "register") {
            const reg = entry as RegisterLeaf;
            if (!contains(remoteVV, reg.dot)) {
                ops.push({ op: "set_register", path: [...path, key], value: reg.value, write: reg.dot });
            }
        } else if (entry.type === "counter") {
            const ctr = entry as CounterLeaf;
            // For each actor contribution unseen by remote, emit an update
            for (const [actor, dot] of Object.entries(ctr.actorDots)) {
                if (!contains(remoteVV, dot)) {
                    const p = ctr.p[actor as string] ?? 0;
                    const n = ctr.n[actor as string] ?? 0;
                    ops.push({
                        op: "counter_update",
                        path: [...path, key],
                        actor: actor as string,
                        p,
                        n,
                        dot,
                    });
                }
            }
        } else {
            walkForDiff(entry as MapNode, [...path, key], remoteVV, ops);
        }
    }

    // Emit per-key removes when tombstones not seen by remote
    if (node.removed) {
        for (const [key, vv] of Object.entries(node.removed)) {
            let unseen = false;
            for (const dot of Object.values(vv)) {
                if (!contains(remoteVV, dot)) {
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
            let node: MapNode = doc;
            const path = op.path.slice(0, -1);
            for (const key of path) {
                let child = node.entries[key];
                if (!child || child.type !== "map") {
                    child = { type: "map", dots: {}, entries: {} } as MapNode;
                    node.entries[key] = child;
                }
                node = child as MapNode;
                mergeDot(node.dots, op.write);
            }
            const leafKey = op.path[op.path.length - 1] as string;
            const existing = node.entries[leafKey];
            // Add-wins: only suppress if key's tombstone covers write
            if (node.removed && node.removed[leafKey] && contains(node.removed[leafKey]!, op.write)) {
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
            let node: MapNode = doc;
            for (const key of op.path) {
                const child = node.entries[key];
                if (!child || child.type !== "map") break;
                node = child as MapNode;
            }
            node.removed = node.removed ?? {};
            node.removed[op.key] = vvMerge(node.removed[op.key] ?? {}, op.removeVV);
            delete node.entries[op.key];
        } else if (op.op === "counter_update") {
            // Walk/create parents
            let node: MapNode = doc;
            const path = op.path.slice(0, -1);
            for (const key of path) {
                let child = node.entries[key];
                if (!child || child.type !== "map") {
                    child = { type: "map", dots: {}, entries: {} } as MapNode;
                    node.entries[key] = child;
                }
                node = child as MapNode;
                mergeDot(node.dots, op.dot);
            }
            const leafKey = op.path[op.path.length - 1] as string;
            const existing = node.entries[leafKey];
            if (node.removed && node.removed[leafKey] && contains(node.removed[leafKey]!, op.dot)) continue; // suppressed by remove
            if (!existing || existing.type !== "counter") {
                // create counter leaf with actor contribution
                node.entries[leafKey] = {
                    type: "counter",
                    p: op.p ? { [op.actor]: op.p } : {},
                    n: op.n ? { [op.actor]: op.n } : {},
                    actorDots: { [op.actor]: op.dot },
                    dots: { [op.actor]: op.dot },
                } as CounterLeaf;
            } else {
                const ctr = existing as CounterLeaf;
                // take maxima per-actor to ensure idempotence
                ctr.p[op.actor] = Math.max(ctr.p[op.actor] ?? 0, op.p);
                ctr.n[op.actor] = Math.max(ctr.n[op.actor] ?? 0, op.n);
                ctr.actorDots[op.actor] = op.dot;
                mergeDot(ctr.dots, op.dot);
            }
        }
    }
    return doc;
}
