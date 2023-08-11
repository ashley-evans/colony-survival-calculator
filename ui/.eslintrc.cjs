module.exports = {
    extends: ["../.eslintrc.js", "plugin:react/recommended"],
    env: {
        browser: true,
        node: true,
    },
    settings: {
        react: {
            version: "detect",
        },
    },
    plugins: ["react-refresh"],
    rules: {
        "react-refresh/only-export-components": "warn",
    },
};
