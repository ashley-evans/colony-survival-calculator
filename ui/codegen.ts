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
            config: {
                enumsAsTypes: true,
            },
            presetConfig: {
                gqlTagName: "gql",
            },
        },
    },
};

export default config;
