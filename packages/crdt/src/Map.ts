import { Hlc } from "@bobbyfidz/hlc";
import { unreachable } from "@bobbyfidz/panic";
import { Register } from "./Register.js";
import { VersionVector } from "./VersionVector.js";

export interface Map {
    type: "map";
    entries: Record<string, MapEntry>;
    /**
     * Per-key tombstone: a version-vector summary of what the remover had seen,
     * including the remover’s own delete dot. A key is considered deleted iff
     * entryVersionVector <= tombstoneVersionVector.
     */
    tombstones?: Record<string, VersionVector>;
}

export type MapEntry = Map | Register<unknown>;

function create(): Map {
    return { type: "map", entries: {} };
}

function ensurePath(root: Map, path: string[]): Map {
    let node = root;
    for (const key of path) {
        let child = node.entries[key];
        if (!child || child.type !== "map") {
            child = create();
            node.entries[key] = child;
        }
        node = child;
    }
    return node;
}

function setAtPath<T>(root: Map, path: [string, ...string[]], value: T, dot: Hlc): void {
    const parent = ensurePath(root, path.slice(0, -1));
    const key = path[path.length - 1] as string;

    const existingEntry = parent.entries[key];
    if (!existingEntry || existingEntry.type !== "register") {
        parent.entries[key] = Register.create(value, dot);
    } else {
        parent.entries[key] = Register.set(existingEntry, value, dot);
    }
}
function removeAtPath(root: Map, path: [string, ...string[]], dot: Hlc): void;
function removeAtPath(root: Map, path: [string, ...string[]], versionVector: VersionVector): void;
function removeAtPath(root: Map, path: [string, ...string[]], dotOrVersionVector: Hlc | VersionVector): void {
    const parent = ensurePath(root, path.slice(0, -1));
    if ("actorId" in dotOrVersionVector) {
        dotOrVersionVector = VersionVector.mergeDot(getVersionVector(parent), dotOrVersionVector as Hlc);
    }
    const versionVector = dotOrVersionVector;

    const key = path[path.length - 1] as string;

    parent.tombstones ??= {};
    const existingTombstone = parent.tombstones[key];
    parent.tombstones[key] = existingTombstone
        ? VersionVector.merge(existingTombstone, versionVector)
        : versionVector;
    delete parent.entries[key];
}

function getMapEntryVersionVector(entry: MapEntry): VersionVector {
    if (entry.type === "register") {
        return Register.getVersionVector(entry);
    } else if (entry.type === "map") {
        return getVersionVector(entry);
    } else {
        unreachable(entry);
    }
}

function getVersionVector(node: Map): VersionVector {
    let versionVector: VersionVector = {};

    for (const entry of Object.values(node.entries)) {
        versionVector = VersionVector.merge(versionVector, getMapEntryVersionVector(entry));
    }

    if (node.tombstones) {
        for (const tombstoneVersionVector of Object.values(node.tombstones)) {
            versionVector = VersionVector.merge(versionVector, tombstoneVersionVector);
        }
    }

    return versionVector;
}

function materialize(node: Map): Record<string, unknown> {
    const materialized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(node.entries)) {
        const entryVersionVector = getMapEntryVersionVector(entry);
        const tombstoneVersionVector = node.tombstones?.[key];

        if (
            !tombstoneVersionVector ||
            VersionVector.isConcurrentOrAfter(entryVersionVector, tombstoneVersionVector)
        ) {
            if (entry.type === "register") {
                materialized[key] = entry.value;
            } else {
                materialized[key] = materialize(entry);
            }
        }
    }
    return materialized;
}

export const Map = {
    create,
    setAtPath,
    removeAtPath,
    getVersionVector,
    materialize,
};
