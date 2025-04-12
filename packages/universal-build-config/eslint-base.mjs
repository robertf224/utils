import javascript from "@eslint/js";
import typescript from "typescript-eslint";

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
    }
];