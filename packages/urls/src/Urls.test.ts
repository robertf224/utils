import { describe, it, expect } from "vitest";
import { extend } from "./Urls.js";

describe("extend", () => {
    it("extends a URL with protocol", () => {
        const url = new URL("http://example.com");
        const result = extend(url, { protocol: "https" });
        expect(result.toString()).toBe("https://example.com/");
    });

    it("extends a URL with hostname", () => {
        const url = new URL("https://example.com");
        const result = extend(url, { hostname: "api.example.com" });
        expect(result.toString()).toBe("https://api.example.com/");
    });

    it("extends a URL with port", () => {
        const url = new URL("https://example.com");
        const result = extend(url, { port: 8080 });
        expect(result.toString()).toBe("https://example.com:8080/");
    });

    it("extends a URL with pathname", () => {
        const url = new URL("https://example.com/api");
        const result = extend(url, { pathname: "users" });
        expect(result.toString()).toBe("https://example.com/api/users");
    });

    it("extends a URL with search params", () => {
        const url = new URL("https://example.com/api");
        const result = extend(url, { searchParams: { page: "1", sort: "name" } });
        expect(result.toString()).toBe("https://example.com/api?page=1&sort=name");
    });

    it("extends a URL with hash", () => {
        const url = new URL("https://example.com/api");
        const result = extend(url, { hash: "section" });
        expect(result.toString()).toBe("https://example.com/api#section");
    });

    it("extends a URL with multiple options", () => {
        const url = new URL("https://example.com/api");
        const result = extend(url, {
            protocol: "https",
            hostname: "api.example.com",
            port: 8080,
            pathname: "users",
            searchParams: { page: "1" },
            hash: "section",
        });
        expect(result.toString()).toBe("https://api.example.com:8080/api/users?page=1#section");
    });

    it("merges search params with existing ones", () => {
        const url = new URL("https://example.com/api?page=1");
        const result = extend(url, { searchParams: { sort: "name" } });
        expect(result.toString()).toBe("https://example.com/api?page=1&sort=name");
    });

    it("overwrites existing search params with same key", () => {
        const url = new URL("https://example.com/api?page=1");
        const result = extend(url, { searchParams: { page: "2" } });
        expect(result.toString()).toBe("https://example.com/api?page=2");
    });

    it("joins pathnames correctly", () => {
        const url = new URL("https://example.com/api");
        const result = extend(url, { pathname: "/users/123" });
        expect(result.toString()).toBe("https://example.com/api/users/123");
    });

    it("handles string input", () => {
        const result = extend("https://example.com/api", { pathname: "users" });
        expect(result.toString()).toBe("https://example.com/api/users");
    });

    it("handles numeric search params", () => {
        const url = new URL("https://example.com/api");
        const result = extend(url, { searchParams: { page: 1, limit: 10 } });
        expect(result.toString()).toBe("https://example.com/api?page=1&limit=10");
    });

    it("handles boolean search params", () => {
        const url = new URL("https://example.com/api");
        const result = extend(url, { searchParams: { active: true, verified: false } });
        expect(result.toString()).toBe("https://example.com/api?active=true&verified=false");
    });

    it("preserves existing URL components when not specified", () => {
        const url = new URL("https://example.com:8080/api?page=1#section");
        const result = extend(url, { pathname: "users" });
        expect(result.toString()).toBe("https://example.com:8080/api/users?page=1#section");
    });
});
