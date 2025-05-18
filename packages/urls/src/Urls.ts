import { Pathnames } from "./Pathnames.js";

interface ExtendOptions {
    protocol?: string;
    hostname?: string;
    port?: string | number;
    pathname?: string;
    searchParams?: Record<string, string | number | boolean>;
    hash?: string;
}

/**
 * Extends a URL with a set of options. Search parameters are merged, pathnames are joined,
 * and other options are overwritten.
 */
export function extend(url: URL | string, options: ExtendOptions): URL {
    const newUrl = new URL(url);
    if (options.protocol) {
        newUrl.protocol = options.protocol;
    }
    if (options.hostname) {
        newUrl.hostname = options.hostname;
    }
    if (options.port) {
        newUrl.port = options.port.toString();
    }
    if (options.pathname) {
        newUrl.pathname = Pathnames.join(newUrl.pathname, options.pathname);
    }
    if (options.searchParams) {
        Object.entries(options.searchParams).forEach(([key, value]) => {
            newUrl.searchParams.set(key, value.toString());
        });
    }
    if (options.hash) {
        newUrl.hash = options.hash;
    }
    return newUrl;
}

export const Urls = {
    extend,
};
