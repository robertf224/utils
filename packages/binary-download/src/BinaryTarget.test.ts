import { describe, it, expect, vi } from "vitest";
import { BinaryTarget } from "./BinaryTarget.js";

describe("BinaryTarget", () => {
    it("should detect system target correctly", () => {
        const originalPlatform = process.platform;
        const originalArch = process.arch;

        // Mock process.platform and process.arch
        Object.defineProperty(process, "platform", { value: "darwin" });
        Object.defineProperty(process, "arch", { value: "x64" });

        const systemInfo = BinaryTarget.detectSystemTarget();

        expect(systemInfo).toEqual({
            platform: "darwin",
            arch: "x64",
            libc: undefined,
        });

        // Restore original values
        Object.defineProperty(process, "platform", { value: originalPlatform });
        Object.defineProperty(process, "arch", { value: originalArch });
    });

    it("should detect Linux with glibc correctly", () => {
        const originalPlatform = process.platform;
        const originalArch = process.arch;

        // Mock process.platform and process.arch
        Object.defineProperty(process, "platform", { value: "linux" });
        Object.defineProperty(process, "arch", { value: "arm64" });

        const systemInfo = BinaryTarget.detectSystemTarget();

        expect(systemInfo).toEqual({
            platform: "linux",
            arch: "arm64",
            libc: "glibc",
        });

        // Restore original values
        Object.defineProperty(process, "platform", { value: originalPlatform });
        Object.defineProperty(process, "arch", { value: originalArch });
    });

    it("should detect Windows correctly", () => {
        const originalPlatform = process.platform;
        const originalArch = process.arch;

        // Mock process.platform and process.arch
        Object.defineProperty(process, "platform", { value: "win32" });
        Object.defineProperty(process, "arch", { value: "x64" });

        const systemInfo = BinaryTarget.detectSystemTarget();

        expect(systemInfo).toEqual({
            platform: "windows",
            arch: "x64",
            libc: undefined,
        });

        // Restore original values
        Object.defineProperty(process, "platform", { value: originalPlatform });
        Object.defineProperty(process, "arch", { value: originalArch });
    });

    it("should return undefined for unsupported platform", () => {
        const originalPlatform = process.platform;

        // Mock process.platform
        Object.defineProperty(process, "platform", { value: "freebsd" });

        const systemInfo = BinaryTarget.detectSystemTarget();

        expect(systemInfo).toBeUndefined();

        // Restore original value
        Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("should return undefined for unsupported architecture", () => {
        const originalArch = process.arch;

        // Mock process.arch
        Object.defineProperty(process, "arch", { value: "ia32" });

        const systemInfo = BinaryTarget.detectSystemTarget();

        expect(systemInfo).toBeUndefined();

        // Restore original value
        Object.defineProperty(process, "arch", { value: originalArch });
    });

    it("should detect musl libc on Linux", () => {
        const originalPlatform = process.platform;
        const originalArch = process.arch;

        // Mock process.platform and process.arch
        Object.defineProperty(process, "platform", { value: "linux" });
        Object.defineProperty(process, "arch", { value: "x64" });

        const systemInfo = BinaryTarget.detectSystemTarget();

        expect(systemInfo).toEqual({
            platform: "linux",
            arch: "x64",
            libc: "glibc", // Default behavior when execSync is not available
        });

        // Restore original values
        Object.defineProperty(process, "platform", { value: originalPlatform });
        Object.defineProperty(process, "arch", { value: originalArch });
    });
});
