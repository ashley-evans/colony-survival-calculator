/// <reference types="vitest" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    define: {
        "globalThis.__DEV__": JSON.stringify(
            process.env.NODE_ENV === "development",
        ),
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./src/test/setup.tsx",
    },
});
