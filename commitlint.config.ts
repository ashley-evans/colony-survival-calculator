import type { UserConfig } from "@commitlint/types";

const configuration: UserConfig = {
    extends: ["@commitlint/config-conventional"],
    ignores: [
        (message) => /^Bumps \[.+]\(.+\) from .+ to .+\.$/m.test(message),
    ],
};

module.exports = configuration;
