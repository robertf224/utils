import { Result } from "@bobbyfidz/result";
import { Base64DecodingError } from "./Base64DecodingError.js";

function encode(input: string): string {
    return btoa(input);
}

function decode(input: string): Result<string, Base64DecodingError> {
    try {
        return Result.ok(atob(input));
    } catch (error) {
        return Result.err(new Base64DecodingError({ cause: error }));
    }
}

export const Base64 = {
    encode,
    decode,
};
