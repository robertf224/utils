import { Hlc } from "@bobbyfidz/hlc";
import { unreachable } from "@bobbyfidz/panic";
import { Register } from "./Register.js";
import { VersionVector } from "./VersionVector.js";

export interface Map {
    type: "map";
    entries: Record<string, MapEntry>;
    tombstones?: Record<string, VersionVector>;
    dots: VersionVector;
}

export type MapEntry = Map | Register<unknown>;

function create(peerId: string, now: Hlc): Map {
    return {
        type: "map",
        entries: {},
        dots: { [peerId]: now },
    };
}

function touchNode(node: Map, dot: Hlc): void {
    node.dots = VersionVector.mergeDot(node.dots, dot);
}

function ensurePath(root: Map, path: string[], dot: Hlc): Map {
    let node: Map = root;
    for (const key of path) {
        const child = node.entries[key];
        if (!child || child.type !== "map") {
            const newEntry: Map = { type: "map", entries: {}, dots: {} };
            touchNode(newEntry, dot);
            node.entries[key] = newEntry;
            node = newEntry;
        } else {
            touchNode(child, dot);
            node = child;
        }
    }
    return node;
}

function setAtPath<T>(root: Map, path: [string, ...string[]], value: T, dot: Hlc): void {
    const parent = ensurePath(root, path.slice(0, -1), dot);
    const key = path[path.length - 1] as string;
    const existingEntry = parent.entries[key];
    // This is a little sus, but later we can enforce schemas?
    if (!existingEntry || existingEntry.type !== "register") {
        parent.entries[key] = Register.create(value, dot);
    } else {
        parent.entries[key] = Register.set(existingEntry, value, dot);
    }
    touchNode(root, dot);
}

function removeAtPath(root: Map, path: [string, ...string[]], removeSummary: VersionVector): Map {
    // Touch ancestors with the ENTIRE remove summary (merge each dot), so diffs won't prune the subtree prematurely
    const parentPath = path.slice(0, -1);
    let node = root;
    for (const key of parentPath) {
        let child = node.entries[key];
        if (!child || child.type !== "map") {
            child = { type: "map", entries: {}, dots: {} };
            node.entries[key] = child;
        }
        // Merge full summary into ancestor dots (single merge of all actors)
        node.dots = VersionVector.merge(node.dots, removeSummary);
        node = child;
    }
    const parent = node;
    const key = path[path.length - 1] as string;
    parent.tombstones = parent.tombstones ?? {};
    parent.tombstones[key] = parent.tombstones[key]
        ? VersionVector.merge(parent.tombstones[key], removeSummary)
        : { ...removeSummary };
    delete parent.entries[key];
    return root;
}

function getVersionVector(root: Map): VersionVector {
    return Object.values(root.entries).reduce((versionVector, entry) => {
        if (entry.type === "register") {
            return VersionVector.merge(versionVector, Register.getVersionVector(entry));
        } else if (entry.type === "map") {
            return VersionVector.merge(versionVector, getVersionVector(entry));
        } else {
            unreachable(entry);
        }
    }, {} as VersionVector);
}

export const Map = {
    create,
    setAtPath,
    removeAtPath,
    getVersionVector,
};
