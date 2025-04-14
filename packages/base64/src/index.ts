import type { Result } from "@bobbyfidz/result";
import type { Base64DecodingError } from "./Base64DecodingError.js";

export declare const Base64: {
    encode: (input: string) => string;
    decode: (input: string) => Result<string, Base64DecodingError>;
};
