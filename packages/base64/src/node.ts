import { Result } from "@bobbyfidz/result";
import { Base64DecodingError } from "./Base64DecodingError.js";

function encode(input: string): string {
    return Buffer.from(input).toString("base64");
}

function decode(input: string): Result<string, Base64DecodingError> {
    try {
        return Result.ok(Buffer.from(input, "base64").toString());
    } catch (error) {
        return Result.err(new Base64DecodingError({ cause: error }));
    }
}

export const Base64 = {
    encode,
    decode,
};
