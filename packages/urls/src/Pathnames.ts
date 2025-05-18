function join(...segments: string[]): string {
    const normalizedSegments = segments
        .filter((segment) => segment !== "")
        .map((segment) => segment.replace(/^\/+|\/+$/g, ""));
    const joinedPath = normalizedSegments.join("/");
    return joinedPath ? `/${joinedPath}` : "/";
}

export const Pathnames = {
    join,
};
