import type { MongoMemoryServer } from "mongodb-memory-server";

declare global {
    // safely extend the globalThis type
    var __mongoMemoryServer: MongoMemoryServer | undefined;
}

export {};
