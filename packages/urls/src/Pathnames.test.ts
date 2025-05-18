import { describe, it, expect } from "vitest";
import { Pathnames } from "./Pathnames.js";

describe("Urls.join", () => {
    it("joins path segments", () => {
        const result = Pathnames.join("api", "users");
        expect(result).toBe("/api/users");
    });

    it("joins multiple path segments", () => {
        const result = Pathnames.join("api", "users", "123");
        expect(result).toBe("/api/users/123");
    });

    it("handles leading and trailing slashes", () => {
        const result = Pathnames.join("/api/", "/users/", "123/");
        expect(result).toBe("/api/users/123");
    });

    it("handles multiple consecutive slashes", () => {
        const result = Pathnames.join("api///", "///users", "///123");
        expect(result).toBe("/api/users/123");
    });

    it("filters out empty segments", () => {
        const result = Pathnames.join("api", "", "users", "", "123");
        expect(result).toBe("/api/users/123");
    });

    it("handles single path segment", () => {
        const result = Pathnames.join("api");
        expect(result).toBe("/api");
    });

    it("handles empty input", () => {
        const result = Pathnames.join();
        expect(result).toBe("/");
    });

    it("handles segments with dots", () => {
        const result = Pathnames.join("api", "v1.0", "users");
        expect(result).toBe("/api/v1.0/users");
    });

    it("handles segments with special characters", () => {
        const result = Pathnames.join("api", "user-profiles", "123");
        expect(result).toBe("/api/user-profiles/123");
    });

    it("handles segments with encoded characters", () => {
        const result = Pathnames.join("api", "users", "john%20doe");
        expect(result).toBe("/api/users/john%20doe");
    });

    describe("with URL objects", () => {
        it("composes with URL constructor", () => {
            const base = "https://example.com";
            const path = Pathnames.join("api", "users");
            const url = new URL(path, base);
            expect(url.toString()).toBe("https://example.com/api/users");
        });

        it("composes with existing URL objects", () => {
            const url = new URL("https://example.com/api");
            url.pathname = Pathnames.join(url.pathname, "users");
            expect(url.toString()).toBe("https://example.com/api/users");
        });

        it("preserves URL components when updating pathname", () => {
            const url = new URL("https://example.com/api?sort=name#section");
            url.pathname = Pathnames.join(url.pathname, "users");
            expect(url.toString()).toBe("https://example.com/api/users?sort=name#section");
        });

        it("handles relative URLs", () => {
            const url = new URL("/api", "https://example.com");
            url.pathname = Pathnames.join(url.pathname, "users");
            expect(url.toString()).toBe("https://example.com/api/users");
        });

        it("handles URLs with trailing slashes", () => {
            const url = new URL("https://example.com/api/");
            url.pathname = Pathnames.join(url.pathname, "users");
            expect(url.toString()).toBe("https://example.com/api/users");
        });
    });
});
