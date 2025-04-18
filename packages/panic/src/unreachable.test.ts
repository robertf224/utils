import { describe, expect, it } from "vitest";
import { unreachable } from "./unreachable.js";

describe("unreachable", () => {
    it("should throw an error with default message", () => {
        expect(() => unreachable("unexpected value" as never)).toThrow(
            'Unreachable code detected ("unexpected value").'
        );
    });
});
