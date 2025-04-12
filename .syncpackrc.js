/** @type {import("syncpack").RcFile} */
const config = {
    dependencyTypes: ["prod", "dev"],
    specifierTypes: ["range", "exact", "file", "workspace-protocol"],
    semverGroups: [
        {
            range: "~",
            dependencies: ["typescript"],
        },
        {
            range: "",
            dependencies: ["next", "eslint-config-next", "turbo"],
        },
        {
            range: "^",
        },
    ],
};

module.exports = config;
