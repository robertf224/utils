import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { BinaryDownload } from "@bobbyfidz/binary-download";

const execAsync = promisify(exec);

const VERSION = "1.2.2";
const CLI_NAME = "oras";

async function ensureBinary(): Promise<string> {
    return BinaryDownload.ensure(
        CLI_NAME,
        VERSION,
        (binaryTarget) => ({
            url: `https://github.com/oras-project/oras/releases/download/v${VERSION}/oras_${VERSION}_${binaryTarget.platform}_${binaryTarget.arch === "x64" ? "amd64" : "arm64"}.tar.gz`,
        }),
        path.join(__dirname, "..", "node_modules", ".cache", "oci")
    );
}

async function executeCommand(args: string[]): Promise<{ stdout: string; stderr: string }> {
    const cliPath = await ensureBinary();
    return await execAsync(`${cliPath} ${args.join(" ")}`);
}

/**
 * Push an artifact to a registry
 */
async function push(opts: { paths: string[]; tag: string }): Promise<void> {
    const args = ["push"];

    if (opts.tag.startsWith("localhost")) {
        args.push("--plain-http");
    }

    args.push(opts.tag);
    args.push(...opts.paths);

    await executeCommand(args);
}

export const Oras = {
    push,
};
