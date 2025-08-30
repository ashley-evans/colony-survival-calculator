import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { vi } from "vitest";

const databaseName = "TestDatabase";

let mongoDBMemoryServer: MongoMemoryServer;

beforeAll(async () => {
    mongoDBMemoryServer = await MongoMemoryServer.create({
        binary: {
            version: "8.0.4",
        },
        instance: {
            dbName: databaseName,
        },
    });
});

beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("MONGO_DB_URI", mongoDBMemoryServer.getUri());
    vi.stubEnv("AWS_ACCESS_KEY_ID", "test_access_key_id");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "test_secret_access_key");
    vi.stubEnv("TEST_ENV", "true");
});

test.each([
    [
        "mongodb URI",
        "MONGO_DB_URI",
        "Misconfigured: URI for MongoDB not provided",
    ],
    [
        "AWS access key ID",
        "AWS_ACCESS_KEY_ID",
        "Misconfigured: AWS Access Key ID not provided",
    ],
    [
        "AWS secret access key",
        "AWS_SECRET_ACCESS_KEY",
        "Misconfigured: AWS Secret Access Key not provided",
    ],
])(
    "throws an error if %s configuration not provided",
    async (_: string, key: string, expectedError: string) => {
        delete process.env["TEST_ENV"];
        delete process.env[key];

        expect.assertions(1);
        await expect(async () => {
            await import("..");
        }).rejects.toThrow(expectedError);
    },
);

test("returns a mongo DB client", async () => {
    const client = await (await import("..")).default;

    expect(client).toBeInstanceOf(MongoClient);

    await client.close();
});

afterAll(async () => {
    await mongoDBMemoryServer.stop();
});
