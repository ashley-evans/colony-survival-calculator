module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    root: true,
    env: {
        browser: true,
        node: true,
    },
    settings: {
        react: {
            version: "detect",
        },
    },
};
