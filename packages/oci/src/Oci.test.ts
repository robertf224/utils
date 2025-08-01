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
});
