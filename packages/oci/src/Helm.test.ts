/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Helm } from "./Helm.js";

// Mock child_process.exec
vi.mock("child_process", () => ({
    exec: vi.fn(),
}));

// Mock util.promisify
vi.mock("util", () => ({
    promisify: vi.fn((fn) => fn),
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
        ensure: vi.fn(() => Promise.resolve("/tmp/helm")),
    },
}));

describe("Helm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("packageChart", () => {
        it("should execute package command with basic options", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockResolvedValue({
                stdout: "Successfully packaged chart and saved it to: /tmp/mychart-1.0.0.tgz",
                stderr: "",
            } as any);

            const result = await Helm.packageChart({
                path: "/path/to/chart",
                version: "1.0.0",
            });

            expect(mockExec).toHaveBeenCalledWith(
                expect.stringContaining("helm package /path/to/chart --version 1.0.0"),
                { cwd: undefined }
            );
            expect(result).toBe("/tmp/mychart-1.0.0.tgz");
        });

        it("should execute package command with destination", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockResolvedValue({
                stdout: "Successfully packaged chart and saved it to: /tmp/output/mychart-2.0.0.tgz",
                stderr: "",
            } as any);

            const result = await Helm.packageChart({
                path: "/path/to/chart",
                version: "2.0.0",
                destinationFolder: "/tmp/output",
            });

            expect(mockExec).toHaveBeenCalledWith(
                expect.stringContaining(
                    "helm package /path/to/chart --version 2.0.0 --destination /tmp/output"
                ),
                { cwd: undefined }
            );
            expect(result).toBe("/tmp/output/mychart-2.0.0.tgz");
        });

        it("should throw error when package fails", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockRejectedValue(new Error("Command failed"));

            await expect(
                Helm.packageChart({
                    path: "/path/to/chart",
                    version: "1.0.0",
                })
            ).rejects.toThrow("Command failed");
        });

        it("should throw error when stdout does not contain expected pattern", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockResolvedValue({
                stdout: "Some unexpected output",
                stderr: "",
            } as any);

            await expect(
                Helm.packageChart({
                    path: "/path/to/chart",
                    version: "1.0.0",
                })
            ).rejects.toThrow("Failed to determine packaged chart path");
        });
    });

    describe("push", () => {
        it("should execute push command with basic options", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockResolvedValue({ stdout: "", stderr: "" } as any);

            await Helm.push({
                path: "/tmp/mychart-1.0.0.tgz",
                repositoryUrl: "https://charts.example.com",
            });

            expect(mockExec).toHaveBeenCalledWith(
                expect.stringContaining("helm push /tmp/mychart-1.0.0.tgz https://charts.example.com"),
                { cwd: undefined }
            );
        });

        it("should execute push command with authentication", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockResolvedValue({ stdout: "", stderr: "" } as any);

            await Helm.push({
                path: "/tmp/mychart-1.0.0.tgz",
                repositoryUrl: "https://charts.example.com",
                username: "user",
                password: "pass",
            });

            expect(mockExec).toHaveBeenCalledWith(
                expect.stringContaining(
                    "helm push /tmp/mychart-1.0.0.tgz https://charts.example.com --username user --password pass"
                ),
                { cwd: undefined }
            );
        });

        it("should throw error when push fails", async () => {
            const mockExec = vi.mocked((await import("child_process")).exec);
            mockExec.mockRejectedValue(new Error("Push failed"));

            await expect(
                Helm.push({
                    path: "/tmp/mychart-1.0.0.tgz",
                    repositoryUrl: "https://charts.example.com",
                })
            ).rejects.toThrow("Push failed");
        });
    });
});
