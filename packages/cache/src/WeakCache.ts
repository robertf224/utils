// should work w/ complex keys and structural equality

export class WeakCache<K, V extends object> {
    #cache: Map<string, WeakRef<V>>;

    constructor() {
        this.#cache = new Map();
    }
}
