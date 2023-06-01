import { MongoClient, MongoClientOptions } from "mongodb";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

const validateMongoDBURI = (uri?: string): E.Either<Error, string> =>
    E.fromNullable(new Error("Misconfigured: URI for MongoDB not provided"))(
        uri
    );

const validateAccessKeyID = (accessKeyID?: string): E.Either<Error, string> =>
    E.fromNullable(new Error("Misconfigured: AWS Access Key ID not provided"))(
        accessKeyID
    );

const validateSecretAccessKey = (
    secretAccessKey?: string
): E.Either<Error, string> =>
    E.fromNullable(
        new Error("Misconfigured: AWS Secret Access Key not provided")
    )(secretAccessKey);

const createMongoDBClientOption = (
    accessKeyID: string,
    secretAccessKey: string,
    testEnvironment?: unknown
): MongoClientOptions =>
    pipe(
        O.fromNullable(testEnvironment),
        O.fold(
            () => ({
                auth: {
                    username: accessKeyID,
                    password: secretAccessKey,
                },
                authSource: "$external",
                authMechanism: "MONGODB-AWS",
            }),
            () => ({})
        )
    );

const connectToMongoDB = (
    uri: string,
    options: Readonly<MongoClientOptions>
): T.TaskEither<Error, MongoClient> =>
    T.tryCatch(
        () => MongoClient.connect(uri, options),
        (error) => new Error(`Unable to connect to URI: ${error}`)
    );

type ConnectionDetails = Readonly<{
    uri?: string;
    accessKeyID?: string;
    secretAccessKey?: string;
    testEnvironment?: unknown;
}>;

export default ({
    uri,
    accessKeyID,
    secretAccessKey,
    testEnvironment,
}: ConnectionDetails): T.TaskEither<Error, MongoClient> =>
    pipe(
        E.Do,
        E.bind("accessKeyID", () => validateAccessKeyID(accessKeyID)),
        E.bind("secretAccessKey", () =>
            validateSecretAccessKey(secretAccessKey)
        ),
        E.map(({ accessKeyID, secretAccessKey }) =>
            createMongoDBClientOption(
                accessKeyID,
                secretAccessKey,
                testEnvironment
            )
        ),
        E.bindTo("options"),
        E.bind("uri", () => validateMongoDBURI(uri)),
        T.fromEither,
        T.chain(({ uri, options }) => connectToMongoDB(uri, options))
    );
