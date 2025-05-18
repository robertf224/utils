function join<T extends URL | string>(base: T, ...paths: string[]): T {
    const baseUrl: URL | string =
        base instanceof URL
            ? base
            : (() => {
                  try {
                      return new URL(base);
                  } catch {
                      return base;
                  }
              })();

    const basePath: string = baseUrl instanceof URL ? baseUrl.pathname : baseUrl;
    const normalizedBasePath = basePath.replace(/^\/+|\/+$/g, "");
    const normalizedPaths = paths.filter((path) => path !== "").map((path) => path.replace(/^\/+|\/+$/g, ""));
    const allPaths = [normalizedBasePath, ...normalizedPaths].filter((path) => path !== "");
    const joinedPath = allPaths.join("/");
    const finalPath = joinedPath ? `/${joinedPath}` : "/";

    if (base instanceof URL) {
        const newUrl = new URL(base);
        newUrl.pathname = finalPath;
        return newUrl as T;
    } else {
        return finalPath as T;
    }
}

export const Urls = {
    join,
};
