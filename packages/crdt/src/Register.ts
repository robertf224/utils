import { Hlc } from "@bobbyfidz/hlc";
import { VersionVector } from "./VersionVector.js";

export interface Register<T = unknown> {
    type: "register";
    value: T;
    dot: Hlc;
}

function create<T>(value: T, write: Hlc): Register<T> {
    return { type: "register", value, dot: write };
}

function set<T>(register: Register<T>, value: T, dot: Hlc): Register<T> {
    if (Hlc.compare(dot, register.dot) >= 0) {
        return { type: "register", value, dot };
    }
    return register;
}

function getVersionVector(register: Register): VersionVector {
    return { [register.dot.actorId]: register.dot };
}

export const Register = { create, set, getVersionVector };
