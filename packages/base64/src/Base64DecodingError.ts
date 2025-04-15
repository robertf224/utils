export class Base64DecodingError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}
