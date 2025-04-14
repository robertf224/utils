import type { Base64DecodingError } from "./Base64DecodingError";

export declare const Base64: {
    encode: (input: string) => string;
    decode: (input: string) => Result<string, Base64DecodingError>;
};
