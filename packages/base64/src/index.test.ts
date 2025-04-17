import { Result } from "@bobbyfidz/result";
import { describe, it, expect } from "vitest";
import { Base64 } from "./node.js";

describe("Base64", () => {
    it("encodes a string to base64", () => {
        const input = "hello world";
        const encoded = Base64.encode(input);
        expect(encoded).toBe("aGVsbG8gd29ybGQ=");
    });

    it("decodes a valid base64 string", () => {
        const base64Str = "aGVsbG8gd29ybGQ=";
        const result = Base64.decode(base64Str);
        expect(Result.unwrap(result)).toBe("hello world");
    });
});
