import { describe, it, expect } from "vitest";
import { Result } from "./Result.js";

describe("Result", () => {
    describe("ok", () => {
        it("should create an ok result with the provided value", () => {
            const value = 42;
            const result = Result.ok(value);
            expect(result).toEqual({ value });
            expect(Result.isOk(result)).toBe(true);
            expect(Result.isError(result)).toBe(false);
        });
    });

    describe("err", () => {
        it("should create an error result with the provided error", () => {
            const error = new Error("Something went wrong");
            const result = Result.err(error);
            expect(result).toEqual({ error });
            expect(Result.isError(result)).toBe(true);
            expect(Result.isOk(result)).toBe(false);
        });
    });

    describe("map", () => {
        it("should map an ok value", () => {
            const value = 7;
            const result = Result.ok(value);
            const mappedResult = Result.map(result, (v) => v * 2);
            expect(mappedResult).toEqual({ value: 14 });
        });

        it("should not apply the mapper when result is an error", () => {
            const error = new Error("failure");
            const result = Result.err(error);
            const mappedResult = Result.map(result, (v: number) => v * 2);
            expect(mappedResult).toEqual({ error });
        });
    });

    describe("unwrap", () => {
        it("should return the value for an ok result", () => {
            const value = "hello";
            const result = Result.ok(value);
            expect(Result.unwrap(result)).toBe(value);
        });

        it("should throw the error for an error result", () => {
            const error = new Error("oops");
            const result = Result.err(error);
            expect(() => Result.unwrap(result)).toThrow(error);
        });
    });
});
