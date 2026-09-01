import type { CodegenConfig } from "@graphql-codegen/cli";
import { schema } from "@colony-survival-calculator/api";

const config: CodegenConfig = {
    schema,
    documents: ["src/**/*.tsx"],
    ignoreNoDocuments: true,
    generates: {
        "src/graphql/__generated__/": {
            preset: "client",
            plugins: [],
            presetConfig: {
                gqlTagName: "gql",
            },
            config: {
                nonOptionalTypename: true,
            },
        },
        "src/graphql/__generated__/schema-types.ts": {
            plugins: [
                { add: { content: "/* eslint-disable */" } },
                "typescript",
            ],
        },
    },
};

export default config;
