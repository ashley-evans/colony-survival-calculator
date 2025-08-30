const { defineConfig } = require("eslint/config");
const globals = require("globals");
const rootConfig = require("../eslint.config.js");

module.exports = defineConfig([
    ...rootConfig,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
]);
