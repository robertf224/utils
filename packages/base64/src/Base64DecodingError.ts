export class Base64DecodingError extends Error {
    name = this.constructor.name;

    constructor(options: ErrorOptions) {
        super("Failed to decode base64 string.", options);
    }
}
