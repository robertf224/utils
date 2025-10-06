import { existsSync, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { invariant } from "@bobbyfidz/panic";
import * as tar from "tar";
import { BinaryTarget } from "./BinaryTarget.js";
import type { ReadableStream } from "stream/web";

async function ensure(
    name: string,
    version: string,
    opts: (binaryTarget: BinaryTarget) => {
        url: string;
        // TODO: add hash verification
        headers?: Record<string, string>;
    },
    destinationFolder: string
): Promise<string> {
    const binaryTarget = BinaryTarget.detectSystemTarget();
    invariant(binaryTarget, "Unsupported platform/architecture.");

    const { url: downloadUrl, headers } = opts(binaryTarget);

    const downloadPath = path.join(destinationFolder, name, version);
    const binaryPath = path.join(downloadPath, name);
    if (!existsSync(binaryPath)) {
        await mkdir(downloadPath, { recursive: true });
        await downloadAndInstallBinary(downloadUrl, name, downloadPath, headers);
    }

    return binaryPath;
}

async function downloadAndInstallBinary(
    downloadUrl: string,
    binaryPath: string,
    downloadPath: string,
    headers?: Record<string, string>
): Promise<void> {
    const response = await fetch(downloadUrl, { headers });
    invariant(
        response.ok && response.body,
        `Failed to download ${downloadUrl} (${response.status}): ${response.statusText}`
    );

    const urlPath = new URL(downloadUrl).pathname;
    const isTarGz = urlPath.endsWith(".tar.gz") || urlPath.endsWith(".tgz");
    if (isTarGz) {
        await pipeline(
            Readable.fromWeb(response.body as ReadableStream),
            tar.extract(
                {
                    cwd: downloadPath,
                },
                [binaryPath]
            )
        );
    } else {
        await pipeline(Readable.fromWeb(response.body as ReadableStream), createWriteStream(binaryPath));
    }
}

export const BinaryDownload = {
    ensure,
};
