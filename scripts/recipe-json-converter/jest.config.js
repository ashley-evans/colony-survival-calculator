/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    clearMocks: true,
    modulePathIgnorePatterns: ["__tests__/utils.ts"],
    watchPathIgnorePatterns: ["temp"],
};
