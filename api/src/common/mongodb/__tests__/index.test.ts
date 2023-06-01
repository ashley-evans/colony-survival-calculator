import { MongoMemoryServer } from "mongodb-memory-server";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import connectToMongoDB from "..";

const validAccessKeyID = "valid access key id";
const validSecretAccessKey = "valid secret access key";
const validTestEnv = "true";

// eslint-disable-next-line functional/no-let
let mongoDBMemoryServer: MongoMemoryServer;

beforeAll(async () => {
    mongoDBMemoryServer = await MongoMemoryServer.create({
        binary: {
            version: "6.0.4",
        },
        instance: {
            dbName: "test database",
        },
    });
});

test.each([
    [
        "mongoDB URI",
        {
            accessKeyID: validAccessKeyID,
            secretAccessKey: validSecretAccessKey,
            testEnvironment: validTestEnv,
        },
        "Misconfigured: URI for MongoDB not provided",
    ],
    [
        "AWS Access Key ID",
        {
            uri: "test",
            secretAccessKey: validSecretAccessKey,
            testEnvironment: validTestEnv,
        },
        "Misconfigured: AWS Access Key ID not provided",
    ],
    [
        "AWS Secret Access Key",
        {
            uri: "test",
            accessKeyID: validAccessKeyID,
            testEnvironment: validTestEnv,
        },
        "Misconfigured: AWS Secret Access Key not provided",
    ],
])(
    "returns an error if %s not provided",
    async (
        _: string,
        input: Parameters<typeof connectToMongoDB>[0],
        expectedErrorMessage: string
    ) => {
        const expectedError = new Error(expectedErrorMessage);

        const actual = await connectToMongoDB(input)();

        expect(actual).toEqualLeft(expectedError);
    }
);

test("returns a mongoDB client if provided valid inputs", async () => {
    const uri = mongoDBMemoryServer.getUri();

    const actual = await pipe(
        connectToMongoDB({
            uri,
            accessKeyID: validAccessKeyID,
            secretAccessKey: validSecretAccessKey,
            testEnvironment: validTestEnv,
        }),
        TE.fold(
            () => T.of(undefined),
            (client) => T.of(client)
        )
    )();

    expect(actual).toBeDefined();
    await actual?.close();
});

afterAll(async () => {
    await mongoDBMemoryServer.stop();
});
