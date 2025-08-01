import { execSync } from "child_process";

export type Platform = "linux" | "darwin" | "windows";
export type Arch = "x64" | "arm64";
export type Libc = "glibc" | "musl";

export interface BinaryTarget {
    platform: Platform;
    arch: Arch;
    libc?: Libc;
}

function detectSystemTarget(): BinaryTarget | undefined {
    let platform: Platform;
    let arch: Arch;
    let libc: Libc | undefined;

    switch (process.platform) {
        case "linux":
            platform = "linux";
            try {
                const output = execSync("ldd --version", { encoding: "utf8" });
                if (output.includes("musl")) {
                    libc = "musl";
                }
            } catch {
                //
            }
            libc ??= "glibc";
            break;
        case "darwin":
            platform = "darwin";
            break;
        case "win32":
            platform = "windows";
            break;
        default:
            return undefined;
    }

    switch (process.arch) {
        case "x64":
            arch = "x64";
            break;
        case "arm64":
            arch = "arm64";
            break;
        default:
            return undefined;
    }

    return {
        platform,
        arch,
        libc,
    };
}

export const BinaryTarget = {
    detectSystemTarget,
};
