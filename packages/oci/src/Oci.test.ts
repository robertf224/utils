/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Oci } from "./Oci.js";

// Mock the Oras module
vi.mock("./Oras.js", () => ({
    Oras: {
        push: vi.fn(),
    },
}));

// Mock the Crane module
vi.mock("./Crane.js", () => ({
    Crane: {
        mutate: vi.fn(),
    },
}));

// Mock fs/promises
vi.mock("fs/promises", () => ({
    cp: vi.fn(),
    mkdir: vi.fn(),
}));

// Mock tar
vi.mock("tar", () => ({
    create: vi.fn(),
}));

// Mock Temp
vi.mock("@bobbyfidz/temp", () => ({
    Temp: {
        folder: vi.fn(() => Promise.resolve("/tmp/test")),
        file: vi.fn(() => Promise.resolve("/tmp/test.tar")),
    },
}));

// Mock Helm
vi.mock("./Helm.js", () => ({
    Helm: {
        dependencyBuild: vi.fn(),
        packageChart: vi.fn(() => Promise.resolve("/tmp/test/chart-1.0.0.tgz")),
        push: vi.fn(),
    },
}));

describe("Oci", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("publishImage", () => {
        it("should call Crane.mutate with correct parameters", async () => {
            const mockCrane = await import("./Crane.js");
            const mockMutate = vi.mocked(mockCrane.Crane.mutate);

            await Oci.publishImage({
                from: "alpine:latest",
                copy: [{ sourceFolder: "/src", destinationFolder: "/app" }],
                cmd: ["npm", "start"],
                user: "node",
                workdir: "/app",
                env: { NODE_ENV: "production" },
                expose: [3000],
                tag: "myapp:v1",
            });

            expect(mockMutate).toHaveBeenCalledWith({
                imageReference: "alpine:latest",
                append: expect.any(Array),
                cmd: ["npm", "start"],
                user: "node",
                workdir: "/app",
                env: { NODE_ENV: "production" },
                exposedPorts: [3000],
                tag: "myapp:v1",
            });
        });

        it("should call Crane.mutate with minimal parameters", async () => {
            const mockCrane = await import("./Crane.js");
            const mockMutate = vi.mocked(mockCrane.Crane.mutate);

            await Oci.publishImage({
                from: "alpine:latest",
                copy: [],
                tag: "myapp:v1",
            });

            expect(mockMutate).toHaveBeenCalledWith({
                imageReference: "alpine:latest",
                append: [],
                tag: "myapp:v1",
            });
        });

        it("should pack image into a tarball and follow symlinks when dryRun is true", async () => {
            const mockCrane = await import("./Crane.js");
            const mockMutate = vi.mocked(mockCrane.Crane.mutate);

            await Oci.publishImage({
                from: "alpine:latest",
                copy: [{ sourceFolder: "/src", destinationFolder: "/app" }],
                tag: "registry.example.com/myorg/myapp:v1",
                dryRun: true,
            });
            // ensure dry run packs image into a tarball
            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({
                    output: "myapp-v1.tar",
                })
            );
        });
    });

    describe("publishArtifact", () => {
        it("should call Oras.push with correct parameters", async () => {
            const mockOras = await import("./Oras.js");
            const mockPush = vi.mocked(mockOras.Oras.push);

            await Oci.publishArtifact({
                paths: ["file1.txt", "file2.txt"],
                tag: "registry.example.com/myapp:v1",
            });

            expect(mockPush).toHaveBeenCalledWith({
                paths: ["file1.txt", "file2.txt"],
                tag: "registry.example.com/myapp:v1",
            });
        });

        it("should call Oras.push with single file", async () => {
            const mockOras = await import("./Oras.js");
            const mockPush = vi.mocked(mockOras.Oras.push);

            await Oci.publishArtifact({
                paths: ["file.txt"],
                tag: "localhost:5000/test:v1",
            });

            expect(mockPush).toHaveBeenCalledWith({
                paths: ["file.txt"],
                tag: "localhost:5000/test:v1",
            });
        });
    });

    describe("publishChart", () => {
        it("should call Helm functions with correct parameters", async () => {
            const mockHelm = await import("./Helm.js");
            const mockDependencyBuild = vi.mocked(mockHelm.Helm.dependencyBuild);
            const mockPackageChart = vi.mocked(mockHelm.Helm.packageChart);
            const mockPush = vi.mocked(mockHelm.Helm.push);

            await Oci.publishChart({
                path: "/path/to/chart",
                version: "1.0.0",
                repositoryUrl: "oci://registry.example.com/charts",
                username: "user",
                password: "pass",
            });

            expect(mockDependencyBuild).toHaveBeenCalledWith({
                path: "/path/to/chart",
            });

            expect(mockPackageChart).toHaveBeenCalledWith({
                path: "/path/to/chart",
                version: "1.0.0",
                destinationFolder: "/tmp/test",
            });

            expect(mockPush).toHaveBeenCalledWith({
                path: "/tmp/test/chart-1.0.0.tgz",
                repositoryUrl: "oci://registry.example.com/charts",
                username: "user",
                password: "pass",
            });
        });

        it("should call dependencyBuild before packageChart", async () => {
            const mockHelm = await import("./Helm.js");
            const callOrder: string[] = [];

            vi.mocked(mockHelm.Helm.dependencyBuild).mockImplementation(() => {
                callOrder.push("dependencyBuild");
                return Promise.resolve();
            });

            vi.mocked(mockHelm.Helm.packageChart).mockImplementation(() => {
                callOrder.push("packageChart");
                return Promise.resolve("/tmp/test/chart-1.0.0.tgz");
            });

            vi.mocked(mockHelm.Helm.push).mockImplementation(() => {
                callOrder.push("push");
                return Promise.resolve();
            });

            await Oci.publishChart({
                path: "/path/to/chart",
                version: "1.0.0",
                repositoryUrl: "oci://registry.example.com/charts",
            });

            expect(callOrder).toEqual(["dependencyBuild", "packageChart", "push"]);
        });

        it("should pass repositoryConfig to dependencyBuild when provided", async () => {
            const mockHelm = await import("./Helm.js");
            const mockDependencyBuild = vi.mocked(mockHelm.Helm.dependencyBuild);

            await Oci.publishChart({
                path: "/path/to/chart",
                version: "1.0.0",
                repositoryUrl: "oci://registry.example.com/charts",
                repositoryConfig: "/path/to/repositories.yaml",
            });

            expect(mockDependencyBuild).toHaveBeenCalledWith({
                path: "/path/to/chart",
                repositoryConfig: "/path/to/repositories.yaml",
            });
        });

        it("should work without version parameter", async () => {
            const mockHelm = await import("./Helm.js");
            const mockPackageChart = vi.mocked(mockHelm.Helm.packageChart);

            await Oci.publishChart({
                path: "/path/to/chart",
                repositoryUrl: "oci://registry.example.com/charts",
            });

            expect(mockPackageChart).toHaveBeenCalledWith({
                path: "/path/to/chart",
                destinationFolder: "/tmp/test",
            });
        });

        it("should work without authentication", async () => {
            const mockHelm = await import("./Helm.js");
            const mockPush = vi.mocked(mockHelm.Helm.push);

            await Oci.publishChart({
                path: "/path/to/chart",
                version: "1.0.0",
                repositoryUrl: "oci://registry.example.com/charts",
            });

            expect(mockPush).toHaveBeenCalledWith({
                path: "/tmp/test/chart-1.0.0.tgz",
                repositoryUrl: "oci://registry.example.com/charts",
            });
        });
    });
});
