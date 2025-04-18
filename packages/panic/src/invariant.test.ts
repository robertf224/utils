import { describe, it, expect } from "vitest";
import { invariant } from "./invariant.js";

describe("invariant", () => {
    it("should not throw an error when the condition is true", () => {
        expect(() => invariant(true)).not.toThrow();
    });

    it("should throw an error with default message when the condition is false", () => {
        expect(() => invariant(false)).toThrow("Invariant failed.");
    });

    it("should throw an error with custom message when the condition is false", () => {
        expect(() => invariant(false, "Custom error message.")).toThrow("Custom error message.");
    });
});
