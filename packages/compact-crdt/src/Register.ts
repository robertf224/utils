import { Hlc } from "@bobbyfidz/hlc";
import { VersionVector } from "./VersionVector.js";
import type { RegisterLeaf } from "./types.js";

export function createRegister<T>(value: T, write: HlcType, vv?: VV): RegisterLeaf<T> {
    let dots: VV = vv ? { ...vv } : {};
    dots = VersionVector.mergeDot(dots, write);
    return { type: "register", value, dots };
}

export function setRegister<T>(reg: RegisterLeaf<T>, value: T, dot: HlcType): RegisterLeaf<T> {
    const current = maxDot(reg.dots);
    if (!current || Hlc.compare(dot, current) >= 0) {
        let dots = { ...reg.dots } as VV;
        dots = VersionVector.mergeDot(dots, dot);
        return { type: "register", value, dots };
    }
    let dots = { ...reg.dots } as VV;
    dots = VersionVector.mergeDot(dots, dot);
    return { ...reg, dots };
}

export function maxDot(vv: VV): HlcType | undefined {
    let best: HlcType | undefined;
    for (const d of Object.values(vv)) {
        if (!best || Hlc.compare(d, best) > 0) best = d;
    }
    return best;
}
