import fs from "fs";
import path from "path";
import javascript from "@eslint/js";
import typescript from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

function getPackageScope() {
    try {
        const packageJsonPath = path.join(process.cwd(), "package.json");
        const packageName = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))["name"];
        if (packageName && packageName.includes("/")) {
            return packageName.split("/")[0];
        }
    } catch {}
}

function importOrder(scope = getPackageScope()) {
    return {
        plugins: {
            import: importPlugin,
        },
        rules: {
            "import/order": [
                "error",
                {
                    groups: [
                        "builtin",
                        "external",
                        "internal",
                        "parent",
                        "sibling",
                        "index",
                        "object",
                        "type",
                    ],
                    pathGroups: scope
                        ? [
                              {
                                  pattern: `${scope}/**`,
                                  group: "external",
                                  position: "after",
                              },
                          ]
                        : [],
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true,
                    },
                },
            ],
        },
    };
}

export default [
    {
        ignores: ["**/*", "!src", "!src/**/*"],
    },
    javascript.configs.recommended,
    ...typescript.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    importOrder(),
];
