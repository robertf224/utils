function safeStringify(value: unknown): string {
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

export function unreachable(value: never): never {
    throw new Error(`Unreachable code detected (${safeStringify(value)}).`);
}
