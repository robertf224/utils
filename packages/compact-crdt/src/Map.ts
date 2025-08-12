import type { Hlc as HlcType } from "@bobbyfidz/hlc";
import type { VersionVector as VersionVectorType } from "./VersionVector.js";
import { VersionVector } from "./VersionVector.js";
import type { Register as RegisterLeaf } from "./Register.js";
import { Register } from "./Register.js";

export interface MapNode {
    type: "map";
    entries: Record<string, MapEntry>;
    // Node-level dots: summarize latest edits that affected this subtree
    dots: VersionVectorType;
    // Add-wins tombstones per key: a remove is represented by a summary of dots seen at remove time
    removed?: Record<string, VersionVectorType>;
}

export type MapEntry = MapNode | RegisterLeaf<unknown>;

export type DocumentRoot = MapNode;

export function createEmpty(actorId: string, now: HlcType): DocumentRoot {
    return {
        type: "map",
        entries: {},
        dots: { [actorId]: now },
    };
}

function touchNode(node: MapNode, dot: HlcType): void {
    node.dots = VersionVector.mergeDot(node.dots, dot);
}

function ensureParentPath(root: DocumentRoot, path: string[], dot: HlcType): MapNode {
    let node: MapNode = root;
    for (const key of path) {
        const child = node.entries[key];
        if (!child || child.type !== "map") {
            const created: MapNode = { type: "map", entries: {}, dots: {} };
            touchNode(created, dot);
            node.entries[key] = created;
            node = created;
        } else {
            const mapChild = child as MapNode;
            touchNode(mapChild, dot);
            node = mapChild;
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
    const key = path[path.length - 1] as string;
    const existing = parent.entries[key];
    if (!existing || existing.type !== "register") {
        parent.entries[key] = Register.create(value, dot);
    } else {
        parent.entries[key] = Register.set(existing as RegisterLeaf<T>, value, dot);
    }
    touchNode(root, dot);
    return root;
}

export function removeAtPath(
    root: DocumentRoot,
    path: [string, ...string[]],
    removeSummary: VersionVectorType
): DocumentRoot {
    // Use any dot from the summary to touch ancestors
    const anyDot = Object.values(removeSummary)[0] ?? Object.values(root.dots)[0]!;
    const parent = ensureParentPath(root, path.slice(0, -1), anyDot);
    const key = path[path.length - 1] as string;
    parent.removed = parent.removed ?? {};
    parent.removed[key] = parent.removed[key]
        ? VersionVector.merge(parent.removed[key] as VersionVectorType, removeSummary)
        : { ...removeSummary };
    delete parent.entries[key];
    return root;
}

export function deriveVersionVector(root: DocumentRoot): VersionVectorType {
    const vv: VersionVectorType = {};
    function visit(entry: MapEntry): void {
        if ((entry as any).type === "register") {
            const reg = entry as RegisterLeaf<unknown>;
            Object.assign(vv, VersionVector.merge(vv, { [reg.dot.nodeId]: reg.dot }));
            return;
        }
        const node = entry as MapNode;
        for (const dot of Object.values(node.dots)) {
            Object.assign(vv, VersionVector.merge(vv, { [dot.nodeId]: dot }));
        }
        for (const child of Object.values(node.entries)) visit(child);
    }
    visit(root);
    return vv;
}

export function shouldSuppressByRemove(parent: MapNode, key: string, actorDot: HlcType): boolean {
    const tomb = parent.removed?.[key];
    if (!tomb) return false;
    return VersionVector.contains(tomb, actorDot);
}

export function upsertMap(root: DocumentRoot, path: string[], dot: HlcType): DocumentRoot {
    ensureParentPath(root, path, dot);
    touchNode(root, dot);
    return root;
}
