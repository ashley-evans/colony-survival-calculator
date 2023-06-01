/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    modulePathIgnorePatterns: ["<rootDir>/dist"],
    setupFilesAfterEnv: ["@relmify/jest-fp-ts"],
};
