/// <reference types="vitest" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./src/test/setup.tsx",
        pool: "forks",
    },
    // Required as part of workaround detailed here:
    // https://github.com/aws-amplify/amplify-js/issues/9639#issuecomment-1271955246
    resolve: {
        alias: {
            "./runtimeConfig": "./runtimeConfig.browser",
        },
    },
});
