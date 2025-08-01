import { createHash } from "crypto";
import { existsSync, mkdirSync, copyFileSync, createWriteStream } from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { ReadableStream } from "stream/web";
import { invariant } from "@bobbyfidz/panic";
import * as tar from "tar";
import { BinaryTarget } from "./BinaryTarget.js";

const CACHE_FOLDER = path.join(os.homedir(), ".cache", "binary-download");

async function ensure(
    name: string,
    version: string,
    opts: (binaryTarget: BinaryTarget) => {
        url: string;
        // TODO: add hash verification
    },
    destinationFolder: string
): Promise<string> {
    const binaryTarget = BinaryTarget.detectSystemTarget();
    invariant(binaryTarget, "Unsupported platform/architecture.");

    const { url: downloadUrl } = opts(binaryTarget);

    if (!existsSync(CACHE_FOLDER)) {
        mkdirSync(CACHE_FOLDER, { recursive: true });
    }

    const urlHash = createHash("sha256").update(downloadUrl).digest("hex").slice(0, 16);
    const cachedBinaryPath = path.join(CACHE_FOLDER, `${name}-${version}-${urlHash}`);
    if (!existsSync(cachedBinaryPath)) {
        await downloadAndInstallBinary(downloadUrl, name, cachedBinaryPath);
    }

    const binaryPath = path.join(destinationFolder, name, version, name);
    if (!existsSync(binaryPath)) {
        copyFileSync(cachedBinaryPath, binaryPath);
    }

    return binaryPath;
}

async function downloadAndInstallBinary(
    downloadUrl: string,
    binaryPath: string,
    downloadPath: string
): Promise<void> {
    const response = await fetch(downloadUrl);
    invariant(
        response.ok && response.body,
        `Failed to download ${downloadUrl} (${response.status}): ${response.statusText}`
    );

    const urlPath = new URL(downloadUrl).pathname;
    const isTarGz = urlPath.endsWith(".tar.gz") || urlPath.endsWith(".tgz");
    invariant(isTarGz, "Unsupported file type.");

    await pipeline(
        Readable.fromWeb(response.body as ReadableStream),
        tar.extract({}, [binaryPath]),
        createWriteStream(downloadPath)
    );
}

export const BinaryDownload = {
    ensure,
};
