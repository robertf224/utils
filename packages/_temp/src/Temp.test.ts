import { access } from "fs/promises";
import { describe, it, expect, afterEach } from "vitest";
import { Temp, folder, file, cleanup } from "./Temp.js";

describe("Temp", () => {
    afterEach(async () => {
        // Clean up after each test
        await cleanup();
    });

    describe("folder", () => {
        it("should create a temporary directory", async () => {
            const tempDir = await folder();

            expect(tempDir).toBeDefined();
            expect(typeof tempDir).toBe("string");

            // Verify the directory exists
            await expect(access(tempDir)).resolves.not.toThrow();
        });

        it("should create unique directories", async () => {
            const dir1 = await folder();
            const dir2 = await folder();

            expect(dir1).not.toBe(dir2);
        });
    });

    describe("file", () => {
        it("should create a temporary file with extension", async () => {
            const filePath = await file(".txt");

            expect(filePath).toBeDefined();
            expect(typeof filePath).toBe("string");
            expect(filePath).toMatch(/\.txt$/);

            // Verify the file exists
            await expect(access(filePath)).resolves.not.toThrow();
        });

        it("should create a temporary file without extension", async () => {
            const filePath = await file();

            expect(filePath).toBeDefined();
            expect(typeof filePath).toBe("string");

            // Verify the file exists
            await expect(access(filePath)).resolves.not.toThrow();
        });

        it("should create unique files", async () => {
            const file1 = await file(".tmp");
            const file2 = await file(".tmp");

            expect(file1).not.toBe(file2);
        });
    });

    describe("cleanup", () => {
        it("should clean up all tracked items", async () => {
            const tempDir = await folder();
            const tempFile = await file();

            // Verify items exist before cleanup
            await expect(access(tempDir)).resolves.not.toThrow();
            await expect(access(tempFile)).resolves.not.toThrow();

            await cleanup();

            // Verify items are cleaned up
            await expect(access(tempDir)).rejects.toThrow();
            await expect(access(tempFile)).rejects.toThrow();
        });
    });

    describe("Temp object", () => {
        it("should export all functions", () => {
            expect(Temp.folder).toBeDefined();
            expect(Temp.file).toBeDefined();
            expect(Temp.cleanup).toBeDefined();
        });

        it("should work with Temp object methods", async () => {
            const tempDir = await Temp.folder();
            const tempFile = await Temp.file(".log");

            expect(tempDir).toBeDefined();
            expect(tempFile).toBeDefined();

            // Verify they exist
            await expect(access(tempDir)).resolves.not.toThrow();
            await expect(access(tempFile)).resolves.not.toThrow();
        });
    });
});
