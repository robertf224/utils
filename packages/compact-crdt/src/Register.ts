import { Hlc } from "@bobbyfidz/hlc";

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

export const Register = { create, set };
