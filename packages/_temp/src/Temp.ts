import { randomUUID } from "crypto";
import { rmSync } from "fs";
import { writeFile, mkdir, rm } from "fs/promises";
import os from "os";
import path from "path";

const tempItems = new Set<string>();
function cleanupSync(): void {
    for (const item of tempItems) {
        try {
            rmSync(item, { recursive: true, force: true });
            tempItems.delete(item);
        } catch {
            //
        }
    }
}
process.on("exit", cleanupSync);

export async function folder(): Promise<string> {
    const tempFolder = path.join(os.tmpdir(), randomUUID());
    await mkdir(tempFolder);
    tempItems.add(tempFolder);
    return tempFolder;
}

export async function file(extension?: string): Promise<string> {
    const tempFile = path.join(os.tmpdir(), randomUUID() + (extension ?? ""));
    await writeFile(tempFile, "");
    tempItems.add(tempFile);
    return tempFile;
}

/**
 * Manually cleans up all tracked temporary items.
 * Cleanup is handled automatically on process exit, but can be called manually if needed.
 */
export async function cleanup(): Promise<void> {
    for (const item of tempItems) {
        try {
            await rm(item, { recursive: true, force: true });
            tempItems.delete(item);
        } catch {
            //
        }
    }
}

export const Temp = {
    folder,
    file,
    cleanup,
};
