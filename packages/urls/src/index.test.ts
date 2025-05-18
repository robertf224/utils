import { describe, it, expect } from "vitest";
import { Urls } from "./index.js";

describe("Urls.join", () => {
    it("joins string base with single path", () => {
        const result = Urls.join("api", "users");
        expect(result).toBe("/api/users");
        expect(typeof result).toBe("string");
    });

    it("joins string base with multiple paths", () => {
        const result = Urls.join("api", "users", "123");
        expect(result).toBe("/api/users/123");
        expect(typeof result).toBe("string");
    });

    it("joins URL object base with path", () => {
        const base = new URL("https://example.com/api");
        const result = Urls.join(base, "users");
        expect(result).toBeInstanceOf(URL);
        expect(result.pathname).toBe("/api/users");
    });

    it("joins http URL base with path", () => {
        const result = Urls.join("http://example.com/api", "users") as unknown as URL;
        expect(result).toBeInstanceOf(URL);
        expect(result.pathname).toBe("/api/users");
    });

    it("joins https URL base with path", () => {
        const result = Urls.join("https://example.com/api", "users") as unknown as URL;
        expect(result).toBeInstanceOf(URL);
        expect(result.pathname).toBe("/api/users");
    });

    it("joins URL with custom scheme", () => {
        const result = Urls.join("custom://example.com/api", "users") as unknown as URL;
        expect(result).toBeInstanceOf(URL);
        expect(result.pathname).toBe("/api/users");
    });

    it("joins URL with complex scheme", () => {
        const result = Urls.join("my-app+1.0://example.com/api", "users") as unknown as URL;
        expect(result).toBeInstanceOf(URL);
        expect(result.pathname).toBe("/api/users");
    });

    it("joins URL with port", () => {
        const result = Urls.join("https://example.com:8080/api", "users") as unknown as URL;
        expect(result).toBeInstanceOf(URL);
        expect(result.pathname).toBe("/api/users");
    });

    it("handles leading and trailing slashes", () => {
        const result = Urls.join("/api/", "/users/", "123/");
        expect(result).toBe("/api/users/123");
        expect(typeof result).toBe("string");
    });

    it("handles multiple consecutive slashes", () => {
        const result = Urls.join("api///", "///users", "///123");
        expect(result).toBe("/api/users/123");
        expect(typeof result).toBe("string");
    });

    it("filters out empty segments", () => {
        const result = Urls.join("api", "", "users", "", "123");
        expect(result).toBe("/api/users/123");
        expect(typeof result).toBe("string");
    });

    it("handles single path segment", () => {
        const result = Urls.join("api", "users");
        expect(result).toBe("/api/users");
        expect(typeof result).toBe("string");
    });

    it("handles empty base", () => {
        const result = Urls.join("", "users");
        expect(result).toBe("/users");
        expect(typeof result).toBe("string");
    });

    it("handles segments with dots", () => {
        const result = Urls.join("api", "v1.0", "users");
        expect(result).toBe("/api/v1.0/users");
        expect(typeof result).toBe("string");
    });

    it("handles segments with special characters", () => {
        const result = Urls.join("api", "user-profiles", "123");
        expect(result).toBe("/api/user-profiles/123");
        expect(typeof result).toBe("string");
    });

    it("handles segments with encoded characters", () => {
        const result = Urls.join("api", "users", "john%20doe");
        expect(result).toBe("/api/users/john%20doe");
        expect(typeof result).toBe("string");
    });
});
