const { defineConfig, globalIgnores } = require("eslint/config");

const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const globalsLib = require("globals");
const prettier = require("eslint-config-prettier");

module.exports = defineConfig([
    eslint.configs.recommended,
    tseslint.configs.recommended,
    prettier,
    // Override for CommonJS / build & meta config files
    {
        files: [
            "**/eslint.config.{js,cjs}",
            "**/prettier.config.{js,cjs}",
            "**/vite.config.*",
            "**/jest.config.*",
            "**/commitlint.config.*",
            "**/*.config.cjs",
            "api/scripts/**/*.js",
        ],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                ...globalsLib.node,
                require: "readonly",
                module: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
            },
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
    globalIgnores(["**/__generated__/*", "**/dist/*", ".yarn/*"]),
]);
