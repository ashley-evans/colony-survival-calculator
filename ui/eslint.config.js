const { defineConfig } = require("eslint/config");
const globals = require("globals");
const rootConfig = require("../eslint.config.js");
const reactPlugin = require("eslint-plugin-react");
const reactRefresh = require("eslint-plugin-react-refresh");

module.exports = defineConfig([
    ...rootConfig,
    reactPlugin.configs.flat.recommended,
    reactPlugin.configs.flat["jsx-runtime"],
    reactRefresh.configs.vite,
    {
        files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
        ...reactPlugin.configs.flat.recommended,
        languageOptions: {
            ...reactPlugin.configs.flat.recommended.languageOptions,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            "react/jsx-uses-react": "error",
        },
    },
]);
