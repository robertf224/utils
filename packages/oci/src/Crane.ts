import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { BinaryDownload } from "@bobbyfidz/binaries";

const execAsync = promisify(exec);

const BINARY_NAME = "crane";
const VERSION = "0.20.6";

async function ensureBinary(): Promise<string> {
    return BinaryDownload.ensure(
        BINARY_NAME,
        VERSION,
        (binaryTarget) => {
            let platform: string;
            switch (binaryTarget.platform) {
                case "darwin":
                    platform = "Darwin";
                    break;
                case "linux":
                    platform = "Linux";
                    break;
                case "windows":
                    platform = "Windows";
                    break;
            }
            const arch = binaryTarget.arch === "x64" ? "x86_64" : "arm64";
            return {
                url: `https://github.com/google/go-containerregistry/releases/download/v${VERSION}/go-containerregistry_${platform}_${arch}.tar.gz`,
            };
        },
        path.join(import.meta.dirname, "..", "node_modules", ".cache", "oci")
    );
}

async function executeCommand(args: string[]): Promise<{ stdout: string; stderr: string }> {
    const cliPath = await ensureBinary();
    return await execAsync(`${cliPath} ${args.join(" ")}`);
}

async function login(opts: { username: string; password: string; registry: string }): Promise<void> {
    await executeCommand([
        "auth",
        "login",
        opts.registry,
        "--username",
        opts.username,
        "--password",
        opts.password,
    ]);
}

async function mutate(opts: {
    imageReference: string;
    append?: string[];
    cmd?: string[];
    user?: string;
    workdir?: string;
    env?: Record<string, string>;
    exposedPorts?: number[];
    tag?: string;
}): Promise<void> {
    const args = ["mutate", opts.imageReference];

    if (opts.append) {
        for (const append of opts.append) {
            args.push("--append", append);
        }
    }

    if (opts.cmd) {
        for (const cmd of opts.cmd) {
            args.push("--cmd", `"${cmd}"`);
        }
    }

    if (opts.user) {
        args.push("--user", opts.user);
    }

    if (opts.workdir) {
        args.push("--workdir", opts.workdir);
    }

    if (opts.env) {
        for (const [key, value] of Object.entries(opts.env)) {
            args.push("--env", `${key}=${value}`);
        }
    }

    if (opts.exposedPorts) {
        for (const port of opts.exposedPorts) {
            args.push("--exposed-ports", port.toString());
        }
    }

    if (opts.tag) {
        args.push("--tag", opts.tag);
    }

    await executeCommand(args);
}

export const Crane = {
    login,
    mutate,
};
