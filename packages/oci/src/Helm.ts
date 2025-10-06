import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { BinaryDownload } from "@bobbyfidz/binaries";
import { invariant } from "@bobbyfidz/panic";

const execAsync = promisify(exec);

const BINARY_NAME = "helm";
const VERSION = "3.19.0";

async function ensureBinary(): Promise<string> {
    return BinaryDownload.ensure(
        BINARY_NAME,
        VERSION,
        (binaryTarget) => {
            let platform: string;
            switch (binaryTarget.platform) {
                case "darwin":
                    platform = "darwin";
                    break;
                case "linux":
                    platform = "linux";
                    break;
                case "windows":
                    platform = "windows";
                    break;
            }
            const arch = binaryTarget.arch === "x64" ? "amd64" : "arm64";
            const platformAndArch = `${platform}-${arch}`;
            return {
                url: `https://get.helm.sh/helm-v${VERSION}-${platformAndArch}.${platform === "windows" ? "zip" : "tar.gz"}`,
                strategy: { type: "archive", binaryPath: `${platformAndArch}/helm` },
            };
        },
        path.join(import.meta.dirname, "..", "node_modules", ".cache", "oci")
    );
}

async function executeCommand(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string }> {
    const cliPath = await ensureBinary();
    return await execAsync(`${cliPath} ${args.join(" ")}`, { cwd });
}

/**
 * Package a Helm chart into a chart archive.
 */
async function packageChart(opts: {
    /** Path to the chart directory. */
    path: string;
    /** Version of the chart. */
    version: string;
    /** Output folder for the packaged chart. */
    destinationFolder?: string;
}): Promise<string> {
    const args = ["package", opts.path, "--version", opts.version];

    if (opts.destinationFolder) {
        args.push("--destination", opts.destinationFolder);
    }

    const result = await executeCommand(args);

    const match = result.stdout.match(/Successfully packaged chart and saved it to: (.+\.tgz)/);
    invariant(match, "Failed to determine packaged chart path.");

    return match[1]!;
}

/**
 * Push a Helm chart to a repository.
 */
async function push(opts: {
    /** Path to the packaged chart (.tgz file). */
    path: string;
    /** Repository URL. */
    repositoryUrl: string;
    /** Username for authentication. */
    username?: string;
    /** Password for authentication. */
    password?: string;
}): Promise<void> {
    const args = ["push", opts.path, opts.repositoryUrl];

    if (opts.username) {
        args.push("--username", opts.username);
    }

    if (opts.password) {
        args.push("--password", opts.password);
    }

    await executeCommand(args);
}

export const Helm = {
    ensureBinary,
    packageChart,
    push,
};
