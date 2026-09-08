import { MongoMemoryReplSet } from "mongodb-memory-server";

async function createMemoryServer(databaseName: string) {
    return MongoMemoryReplSet.create({
        binary: {
            version: "8.0.4",
        },
        replSet: {
            count: 1,
            dbName: databaseName,
            storageEngine: "wiredTiger",
        },
    });
}

export { createMemoryServer };
