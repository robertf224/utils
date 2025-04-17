import base from "@bobbyfidz/universal-build-config/eslint-base.mjs";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    ...base,
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"],
    reactHooks.configs["recommended-latest"],
    {
        rules: {
            "react/prop-types": "off",
            "react/jsx-uses-react": "error",
        },
    },
];
