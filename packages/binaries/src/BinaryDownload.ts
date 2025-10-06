import { existsSync, createWriteStream } from "fs";
import { mkdir, rename } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { invariant } from "@bobbyfidz/panic";
import { Temp } from "@bobbyfidz/temp";
import * as tar from "tar";
import { BinaryTarget } from "./BinaryTarget.js";
import type { ReadableStream } from "stream/web";

export type BinaryDownloadStrategy =
    | {
          type: "archive";
          /** The path to the binary inside of the archive. Defaults to the name of the binary. */
          binaryPath?: string;
      }
    | {
          type: "direct";
      };

export interface BinaryDownloadOpts {
    url: string;
    headers?: Record<string, string>;
    // TODO: add hash verification
    /** The strategy for unpacking the binary. The default strategy is inferred from the URL. */
    strategy?: BinaryDownloadStrategy;
}

async function ensure(
    name: string,
    version: string,
    opts: (binaryTarget: BinaryTarget) => BinaryDownloadOpts,
    destinationFolder: string
): Promise<string> {
    const binaryTarget = BinaryTarget.detectSystemTarget();
    invariant(binaryTarget, "Unsupported platform/architecture.");

    const downloadOpts = opts(binaryTarget);

    const downloadPath = path.join(destinationFolder, name, version, name);
    if (!existsSync(downloadPath)) {
        await mkdir(path.dirname(downloadPath), { recursive: true });
        await downloadAndInstallBinary(downloadOpts, name, downloadPath);
    }

    return downloadPath;
}

async function downloadAndInstallBinary(
    downloadOpts: BinaryDownloadOpts,
    binaryName: string,
    downloadPath: string
): Promise<void> {
    const response = await fetch(downloadOpts.url, { headers: downloadOpts.headers });
    invariant(
        response.ok && response.body,
        `Failed to download ${downloadOpts.url} (${response.status}): ${response.statusText}`
    );

    let strategy: BinaryDownloadStrategy;
    if (downloadOpts.strategy) {
        strategy = downloadOpts.strategy;
    } else {
        const urlPath = new URL(downloadOpts.url).pathname;
        const hasExtension = urlPath.split("/").pop()?.includes(".");
        if (hasExtension) {
            const isTarGz = urlPath.endsWith(".tar.gz") || urlPath.endsWith(".tgz");
            invariant(isTarGz, "Unsupported file type.");
            strategy = { type: "archive" };
        } else {
            strategy = { type: "direct" };
        }
    }

    if (strategy.type === "archive") {
        const binaryPath = strategy.binaryPath ?? binaryName;
        const tempFolder = await Temp.folder();
        await pipeline(
            Readable.fromWeb(response.body as ReadableStream),
            tar.extract(
                {
                    cwd: tempFolder,
                },
                [binaryPath]
            )
        );
        await rename(path.join(tempFolder, binaryPath), downloadPath);
    } else if (strategy.type === "direct") {
        await pipeline(Readable.fromWeb(response.body as ReadableStream), createWriteStream(downloadPath));
    }
}

export const BinaryDownload = {
    ensure,
};
