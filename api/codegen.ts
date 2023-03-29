import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    schema: "src/graphql/schema.graphql",
    generates: {
        "src/graphql/schema.d.ts": {
            plugins: ["typescript"],
            config: {
                enumsAsTypes: true,
            },
        },
    },
};

export default config;
