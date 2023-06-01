module.exports = {
    extends: [
        "../.eslintrc.js",
        "plugin:functional/external-typescript-recommended",
        "plugin:functional/lite",
        "plugin:functional/stylistic",
    ],
    parserOptions: {
        project: "./api/tsconfig.json",
    },
    plugins: ["@typescript-eslint", "functional"],
    env: {
        node: true,
    },
};
