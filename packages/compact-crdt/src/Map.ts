import type { Hlc as HlcType } from "@bobbyfidz/hlc";
import type { DocumentRoot, MapEntry, MapNode, RegisterLeaf } from "./types.js";
import { createRegister, Register, setRegister } from "./Register.js";
import { createCounter, addToCounter } from "./Counter.js";
import { mergeDot, contains, vvMerge } from "./VersionVector.js";
import type { VersionVector } from "./VersionVector.js";

export interface Map {
    type: "map";
    entries: Record<string, Map | Register>;
    tombstones?: Record<string, VersionVector>;
    // Node-level dots, updated on any structural or child update.
    dots: VersionVector;
}

export type MapEntry = Map | Register;

export function createEmpty(actorId: string, now: HlcType): DocumentRoot {
    const dots: VersionVector = { [actorId]: { ...now } };
    return { type: "map", dots, entries: {} };
}

function touchNode(node: MapNode, dot: HlcType): MapNode {
    const dots = { ...node.dots } as VersionVector;
    const next = mergeDot(dots, dot);
    return { ...node, dots: next };
}

function ensureParentPath(root: DocumentRoot, path: string[], dot: HlcType): MapNode {
    let node: MapNode = root;
    for (const key of path) {
        const child = node.entries[key];
        if (!child || child.type !== "map") {
            const newChild: MapNode = { type: "map", dots: {}, entries: {} };
            newChild.dots = mergeDot(newChild.dots, dot);
            node = node.entries[key] = newChild;
        } else {
            node = node.entries[key] = touchNode(child, dot);
        }
    }
    return node;
}

export function setAtPath<T>(
    root: DocumentRoot,
    path: [string, ...string[]],
    value: T,
    dot: HlcType
): DocumentRoot {
    const parent = ensureParentPath(root, path.slice(0, -1), dot);
    const key = path[path.length - 1]!;
    const existing = parent.entries[key];
    if (!existing) {
        parent.entries[key] = createRegister(value, dot);
    } else if (existing.type === "register") {
        parent.entries[key] = setRegister(existing as RegisterLeaf<T>, value, dot);
    } else {
        parent.entries[key] = createRegister(value, dot);
    }
    return touchNode(root, dot);
}

export function initCounterAtPath(
    root: DocumentRoot,
    path: [string, ...string[]],
    initial: number,
    dot: HlcType
): DocumentRoot {
    const parent = ensureParentPath(root, path.slice(0, -1), dot);
    const key = path[path.length - 1]!;
    parent.entries[key] = createCounter(initial, dot.nodeId, dot);
    return touchNode(root, dot);
}

export function addToCounterAtPath(
    root: DocumentRoot,
    path: [string, ...string[]],
    amount: number,
    dot: HlcType
): DocumentRoot {
    const parent = ensureParentPath(root, path.slice(0, -1), dot);
    const key = path[path.length - 1]!;
    const existing = parent.entries[key];
    if (!existing || existing.type !== "counter") {
        parent.entries[key] = createCounter(0, dot.nodeId, dot);
    }
    parent.entries[key] = addToCounter(parent.entries[key] as any, dot.nodeId, amount, dot);
    return touchNode(root, dot);
}

export function removeAtPath(
    root: DocumentRoot,
    path: [string, ...string[]],
    dotSummary: VersionVector
): DocumentRoot {
    const parent = ensureParentPath(
        root,
        path.slice(0, -1),
        Object.values(dotSummary)[0] ?? Object.values(root.dots)[0]!
    );
    const key = path[path.length - 1]!;
    parent.removed = parent.removed ?? {};
    const existing = parent.removed[key];
    parent.removed[key] = existing ? vvMerge(existing, dotSummary) : { ...dotSummary };
    delete parent.entries[key];
    return root;
}

export function getEntry(root: DocumentRoot, path: string[]): MapEntry | undefined {
    let node: MapNode = root;
    for (let i = 0; i < path.length; i++) {
        const key = path[i]!;
        const child = node.entries[key];
        if (!child) return undefined;
        if (i === path.length - 1) return child;
        if (child.type !== "map") return undefined;
        node = child;
    }
    return node;
}

export function deriveVersionVector(root: DocumentRoot): VersionVector {
    const vv: VersionVector = {};
    function visit(entry: MapEntry): void {
        if (entry.type === "register") {
            vvMerge(vv, { [entry.dot.nodeId]: entry.dot });
            return;
        }
        if (entry.type === "counter") {
            for (const dot of Object.values(entry.dots)) vvMerge(vv, { [dot.nodeId]: dot });
            for (const dot of Object.values(entry.actorDots)) vvMerge(vv, { [dot.nodeId]: dot });
            return;
        }
        for (const dot of Object.values(entry.dots)) vvMerge(vv, { [dot.nodeId]: dot });
        for (const child of Object.values(entry.entries)) visit(child);
    }
    visit(root);
    return vv;
}

export function shouldSuppressByRemove(parent: MapNode, key: string, actorDot: HlcType): boolean {
    const tomb = parent.removed?.[key];
    if (!tomb) return false;
    return contains(tomb, actorDot);
}

export function upsertMap(root: DocumentRoot, path: string[], dot: HlcType): DocumentRoot {
    ensureParentPath(root, path, dot);
    return touchNode(root, dot);
}
