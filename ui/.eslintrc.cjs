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
};
