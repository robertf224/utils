/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Oras } from "./Oras.js";

// Mock child_process.exec
vi.mock("child_process", () => ({
    exec: vi.fn(),
}));

// Mock util.promisify
vi.mock("util", () => ({
    promisify: vi.fn((fn) => fn),
}));

// Mock fs functions
vi.mock("fs", () => ({
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    chmodSync: vi.fn(),
    createWriteStream: vi.fn(),
}));

// Mock path.join
vi.mock("path", () => ({
    default: {
        join: vi.fn((...args) => args.join("/")),
    },
    join: vi.fn((...args) => args.join("/")),
}));

// Mock BinaryDownload
vi.mock("@bobbyfidz/binaries", () => ({
    BinaryDownload: {
        ensure: vi.fn(() => Promise.resolve("/tmp/oras")),
    },
}));

describe("Oras", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("push", () => {
        it("should execute push command with localhost tag", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockResolvedValue({ stdout: "", stderr: "" } as any);

            await Oras.push({
                paths: ["file.txt"],
                tag: "localhost:5000/test:v1",
            });

            expect(mockExec).toHaveBeenCalledWith(
                expect.stringContaining("oras push --plain-http localhost:5000/test:v1 file.txt"),
                { cwd: undefined }
            );
        });

        it("should execute push command with remote tag", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockResolvedValue({ stdout: "", stderr: "" } as any);

            await Oras.push({
                paths: ["file1.txt", "file2.txt"],
                tag: "registry.example.com/myapp:v1",
            });

            expect(mockExec).toHaveBeenCalledWith(
                expect.stringContaining("oras push registry.example.com/myapp:v1 file1.txt file2.txt"),
                { cwd: undefined }
            );
        });

        it("should throw error when push fails", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockRejectedValue(new Error("Command failed"));

            await expect(
                Oras.push({
                    paths: ["file.txt"],
                    tag: "localhost:5000/test:v1",
                })
            ).rejects.toThrow("Command failed");
        });
    });
});
