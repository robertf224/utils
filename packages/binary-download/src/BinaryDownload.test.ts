import * as fs from "fs";
import * as streamPromises from "stream/promises";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BinaryDownload } from "./BinaryDownload.js";

// Mock fs functions
vi.mock("fs", () => ({
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    chmodSync: vi.fn(),
    copyFileSync: vi.fn(),
    createWriteStream: vi.fn(),
    writeFileSync: vi.fn(),
}));

// Mock os.homedir
vi.mock("os", () => ({
    homedir: vi.fn(() => "/home/test"),
    tmpdir: vi.fn(() => "/tmp"),
}));

// Mock path.join
vi.mock("path", () => ({
    join: vi.fn((...args: string[]) => args.join("/")),
    dirname: vi.fn((path: string) => path.split("/").slice(0, -1).join("/")),
    extname: vi.fn((filename: string) => {
        const ext = filename.split(".").pop();
        return ext ? `.${ext}` : "";
    }),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock child_process
vi.mock("child_process", () => ({
    execSync: vi.fn(),
}));

// Mock crypto
vi.mock("crypto", () => ({
    createHash: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn(() => "test-hash-1234567890abcdef"),
    })),
}));

// Mock stream/promises
vi.mock("stream/promises", () => ({
    pipeline: vi.fn(),
}));

// Mock tar
vi.mock("tar", () => ({
    extract: vi.fn(() => ({
        pipe: vi.fn().mockReturnThis(),
    })),
}));

// Mock stream
vi.mock("stream", () => ({
    Readable: {
        fromWeb: vi.fn(() => ({
            pipe: vi.fn().mockReturnThis(),
        })),
    },
}));

describe("BinaryDownload", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("ensure", () => {
        it("should download and install binary when not cached", async () => {
            const mockExistsSync = vi.mocked(fs.existsSync);
            const mockMkdirSync = vi.mocked(fs.mkdirSync);
            const mockCopyFileSync = vi.mocked(fs.copyFileSync);
            const mockFetch = vi.mocked(global.fetch);
            const mockPipeline = vi.mocked(streamPromises.pipeline);

            // Mock that cache doesn't exist initially
            mockExistsSync.mockReturnValueOnce(false); // cache folder doesn't exist
            mockExistsSync.mockReturnValueOnce(false); // cached binary doesn't exist
            mockExistsSync.mockReturnValueOnce(false); // final binary doesn't exist

            // Mock successful fetch response
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: "OK",
                body: new ReadableStream(),
            };
            mockFetch.mockResolvedValue(mockResponse as Response);

            // Mock successful pipeline
            mockPipeline.mockResolvedValue(undefined);

            const result = await BinaryDownload.ensure(
                "test-binary",
                "1.0.0",
                () => ({
                    url: "https://example.com/test-binary-1.0.0.tar.gz",
                }),
                "/destination"
            );

            expect(mockMkdirSync).toHaveBeenCalledWith("/home/test/.cache/binary-download", {
                recursive: true,
            });
            expect(mockFetch).toHaveBeenCalledWith("https://example.com/test-binary-1.0.0.tar.gz");
            expect(mockPipeline).toHaveBeenCalled();
            expect(mockCopyFileSync).toHaveBeenCalledWith(
                "/home/test/.cache/binary-download/test-binary-1.0.0-test-hash-1234567890abcdef",
                "/destination/test-binary/1.0.0/test-binary"
            );
            expect(result).toBe("/destination/test-binary/1.0.0/test-binary");
        });

        it("should use cached binary when available", async () => {
            const mockExistsSync = vi.mocked(fs.existsSync);
            const mockCopyFileSync = vi.mocked(fs.copyFileSync);

            // Mock that cache exists but final binary doesn't
            mockExistsSync.mockReturnValueOnce(true); // cache folder exists
            mockExistsSync.mockReturnValueOnce(true); // cached binary exists
            mockExistsSync.mockReturnValueOnce(false); // final binary doesn't exist

            const result = await BinaryDownload.ensure(
                "test-binary",
                "1.0.0",
                () => ({
                    url: "https://example.com/test-binary-1.0.0.tar.gz",
                }),
                "/destination"
            );

            expect(mockCopyFileSync).toHaveBeenCalledWith(
                "/home/test/.cache/binary-download/test-binary-1.0.0-test-hash-1234567890abcdef",
                "/destination/test-binary/1.0.0/test-binary"
            );
            expect(result).toBe("/destination/test-binary/1.0.0/test-binary");
        });

        it("should return existing binary path when already installed", async () => {
            const mockExistsSync = vi.mocked(fs.existsSync);

            // Mock that both cache and final binary exist
            mockExistsSync.mockReturnValueOnce(true); // cache folder exists
            mockExistsSync.mockReturnValueOnce(true); // cached binary exists
            mockExistsSync.mockReturnValueOnce(true); // final binary exists

            const result = await BinaryDownload.ensure(
                "test-binary",
                "1.0.0",
                () => ({
                    url: "https://example.com/test-binary-1.0.0.tar.gz",
                }),
                "/destination"
            );

            expect(result).toBe("/destination/test-binary/1.0.0/test-binary");
        });

        it("should throw error for unsupported file type", async () => {
            const mockExistsSync = vi.mocked(fs.existsSync);
            const mockFetch = vi.mocked(global.fetch);

            // Mock that cache doesn't exist
            mockExistsSync.mockReturnValueOnce(false);
            mockExistsSync.mockReturnValueOnce(false);

            // Mock successful fetch response
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: "OK",
                body: new ReadableStream(),
            };
            mockFetch.mockResolvedValue(mockResponse as Response);

            await expect(
                BinaryDownload.ensure(
                    "test-binary",
                    "1.0.0",
                    () => ({
                        url: "https://example.com/test-binary-1.0.0.zip", // Not .tar.gz
                    }),
                    "/destination"
                )
            ).rejects.toThrow("Unsupported file type.");
        });

        it("should throw error for failed download", async () => {
            const mockExistsSync = vi.mocked(fs.existsSync);
            const mockFetch = vi.mocked(global.fetch);

            // Mock that cache doesn't exist
            mockExistsSync.mockReturnValueOnce(false);
            mockExistsSync.mockReturnValueOnce(false);

            // Mock failed fetch response
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: "Not Found",
                body: null,
            };
            mockFetch.mockResolvedValue(mockResponse as Response);

            await expect(
                BinaryDownload.ensure(
                    "test-binary",
                    "1.0.0",
                    () => ({
                        url: "https://example.com/test-binary-1.0.0.tar.gz",
                    }),
                    "/destination"
                )
            ).rejects.toThrow(
                "Failed to download https://example.com/test-binary-1.0.0.tar.gz (404): Not Found"
            );
        });
    });
});
