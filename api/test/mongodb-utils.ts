import { MongoMemoryServer } from "mongodb-memory-server";

async function createMemoryServer(databaseName: string) {
    return MongoMemoryServer.create({
        binary: {
            version: "8.0.4",
        },
        instance: {
            dbName: databaseName,
        },
    });
}

export { createMemoryServer };
