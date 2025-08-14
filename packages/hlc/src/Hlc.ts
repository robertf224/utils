import { invariant } from "@bobbyfidz/panic";

export interface Hlc {
    timestamp: number;
    counter: number;
    actorId: string;
}

function create(actorId: string, timestamp: number = Date.now()): Hlc {
    return {
        timestamp,
        counter: 0,
        actorId,
    };
}

function compare(a: Hlc, b: Hlc): number {
    if (a.timestamp == b.timestamp) {
        if (a.counter === b.counter) {
            if (a.actorId === b.actorId) {
                return 0;
            }
            return a.actorId < b.actorId ? -1 : 1;
        }
        return a.counter - b.counter;
    }
    return a.timestamp - b.timestamp;
}

function tick(state: Hlc, now: () => number = Date.now): Hlc {
    const wallClock = now();
    if (wallClock > state.timestamp) {
        return { ...state, timestamp: wallClock, counter: 0 };
    }
    return { ...state, counter: state.counter + 1 };
}

function merge(state: Hlc, remote: Hlc, now: () => number = Date.now): Hlc {
    const wallClock = now();
    if (wallClock > state.timestamp && wallClock > remote.timestamp) {
        return { ...state, timestamp: wallClock, counter: 0 };
    }

    if (state.timestamp === remote.timestamp) {
        return { ...state, counter: Math.max(state.counter, remote.counter) + 1 };
    } else if (state.timestamp > remote.timestamp) {
        return { ...state, counter: state.counter + 1 };
    } else {
        return { ...state, counter: remote.counter + 1 };
    }
}

function toString(state: Hlc): string {
    return `${state.timestamp.toString().padStart(15, "0")}:${state.counter.toString(36).padStart(5, "0")}:${state.actorId}`;
}

function parse(raw: string): Hlc {
    const [timestamp, counter, ...actorId] = raw.split(":");
    invariant(timestamp && counter && actorId.length > 0, "Invalid HLC string.");
    return {
        timestamp: parseInt(timestamp),
        counter: parseInt(counter, 36),
        actorId: actorId.join(":"),
    };
}

export const Hlc = {
    create,
    compare,
    tick,
    merge,
    toString,
    parse,
};
