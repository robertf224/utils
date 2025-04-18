export type Ok<T> = { value: T; error?: never };
export type Err<E extends Error = Error> = { error: E; value?: never };
export type Result<T, E extends Error = Error> = Ok<T> | Err<E>;

function isOk<T>(result: Result<T>): result is Ok<T> {
    return "value" in result;
}

function isErr<T, E extends Error>(result: Result<T, E>): result is Err<E> {
    return "error" in result;
}

function ok(): Ok<void>;
function ok<T>(value: T): Ok<T>;
function ok<T>(value?: T): Ok<T> {
    return { value: value as T };
}

function err<E extends Error = Error>(error: E): Err<E> {
    return { error };
}

function map<T, U, E extends Error = Error>(result: Result<T, E>, mapper: (value: T) => U): Result<U, E> {
    return isOk(result) ? ok(mapper(result.value)) : result;
}

function mapErr<T, E extends Error = Error, U extends Error = Error>(
    result: Result<T, E>,
    mapper: (error: E) => U
): Result<T, U> {
    return isErr(result) ? err(mapper(result.error)) : result;
}

function unwrap<T>(result: Result<T>): T {
    if (isOk(result)) {
        return result.value;
    }
    throw new Error("Tried to call unwrap on an err Result.", { cause: result.error });
}

function unwrapErr<T, E extends Error = Error>(result: Result<T, E>): E {
    if (isErr(result)) {
        return result.error;
    }
    throw new Error("Tried to call unwrapErr on an ok Result.");
}

export const Result = {
    isOk,
    isErr,
    ok,
    err,
    map,
    mapErr,
    unwrap,
    unwrapErr,
};
