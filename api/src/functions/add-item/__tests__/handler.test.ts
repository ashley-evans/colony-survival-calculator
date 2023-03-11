import type { S3EventRecord } from "aws-lambda";
import {
    S3Client,
    GetObjectCommand,
    GetObjectCommandInput,
    GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import { Readable } from "stream";
import { mock } from "jest-mock-extended";

import {
    createS3Event,
    createS3EventBucketDetails,
    createS3EventBucketObjectDetails,
    createS3EventNotificationDetails,
    createS3EventRecord,
} from "../../../../test";
import { addItem } from "../domain/add-item";

jest.mock("../domain/add-item", () => ({
    addItem: jest.fn(),
}));

const mockAddItem = addItem as jest.Mock;

import { handler } from "../handler";

const mockS3Client = mockClient(S3Client);

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
});

const EXPECTED_BUCKET_NAME = "test_bucket_name";
const EXPECTED_KEY = "seeds/test_seed.json";
const EXPECTED_CONTENT = '{ "test": "content" }';
const EXPECTED_PROCESS_SEED_KEY = "ITEM_SEED_KEY";

function createValidEventRecord(key: string): S3EventRecord {
    return createS3EventRecord(
        createS3EventNotificationDetails(
            createS3EventBucketDetails(EXPECTED_BUCKET_NAME),
            createS3EventBucketObjectDetails(key)
        )
    );
}

const validRecord = createValidEventRecord(EXPECTED_KEY);

beforeEach(() => {
    mockS3Client.reset();
    mockAddItem.mockReset();

    mockAddItem.mockResolvedValue(true);
    process.env[EXPECTED_PROCESS_SEED_KEY] = EXPECTED_KEY;
});

describe.each([
    ["undefined records are provided", undefined],
    ["no records are provided", []],
    ["a record with missing notification details", [createS3EventRecord()]],
    [
        "a record with missing bucket details",
        [
            createS3EventRecord(
                createS3EventNotificationDetails(
                    undefined,
                    createS3EventBucketObjectDetails(EXPECTED_KEY)
                )
            ),
        ],
    ],
    [
        "a record with missing bucket name",
        [
            createS3EventRecord(
                createS3EventNotificationDetails(
                    createS3EventBucketDetails(),
                    createS3EventBucketObjectDetails(EXPECTED_KEY)
                )
            ),
        ],
    ],
    [
        "a record with missing bucket object details",
        [
            createS3EventRecord(
                createS3EventNotificationDetails(
                    createS3EventBucketDetails(EXPECTED_BUCKET_NAME),
                    undefined
                )
            ),
        ],
    ],
    [
        "a record with missing bucket object key",
        [
            createS3EventRecord(
                createS3EventNotificationDetails(
                    createS3EventBucketDetails(EXPECTED_BUCKET_NAME),
                    createS3EventBucketObjectDetails()
                )
            ),
        ],
    ],
    ["an unknown object key", [createValidEventRecord("unknown_key")]],
])("handles invalid events with %s", (_: string, records?: S3EventRecord[]) => {
    const event = createS3Event(records);

    test("does not call S3 to get any content", async () => {
        await handler(event);

        const calls = mockS3Client.commandCalls(GetObjectCommand);
        expect(calls).toHaveLength(0);
    });

    test("does not call domain", async () => {
        await handler(event);

        expect(addItem).toHaveBeenCalledTimes(0);
    });
});

describe("handles valid item list create events", () => {
    const event = createS3Event([validRecord]);

    beforeEach(() => {
        const output = mock<GetObjectCommandOutput>();
        output.Body = sdkStreamMixin(Readable.from([EXPECTED_CONTENT]));
        mockS3Client.on(GetObjectCommand).resolves(output);
    });

    test("calls S3 to get item JSON details", async () => {
        await handler(event);

        const calls = mockS3Client.commandCalls(GetObjectCommand);
        expect(calls).toHaveLength(1);
        expect(calls[0]?.args).toHaveLength(1);

        const input = calls[0]?.args[0].input as GetObjectCommandInput;
        expect(input.Bucket).toEqual(EXPECTED_BUCKET_NAME);
        expect(input.Key).toEqual(EXPECTED_KEY);
    });

    test("provides content retrieved from S3 to domain", async () => {
        await handler(event);

        expect(addItem).toHaveBeenCalledTimes(1);
        expect(addItem).toHaveBeenCalledWith(EXPECTED_CONTENT);
    });

    test("does not call domain if no content returned", async () => {
        const output = mock<GetObjectCommandOutput>();
        output.Body = sdkStreamMixin(Readable.from([]));
        mockS3Client.on(GetObjectCommand).resolves(output);

        await handler(event);

        expect(addItem).toHaveBeenCalledTimes(0);
    });
});

describe("given multiple records, one valid and one invalid", () => {
    const invalidEventRecord = createValidEventRecord("unexpected");
    const event = createS3Event([invalidEventRecord, validRecord]);

    beforeEach(() => {
        const output = mock<GetObjectCommandOutput>();
        output.Body = sdkStreamMixin(Readable.from([EXPECTED_CONTENT]));
        mockS3Client
            .on(GetObjectCommand, { Key: EXPECTED_KEY })
            .resolves(output);
    });

    test("only calls S3 to get content for valid record", async () => {
        await handler(event);

        const calls = mockS3Client.commandCalls(GetObjectCommand);
        expect(calls).toHaveLength(1);
        expect(calls[0]?.args).toHaveLength(1);

        const input = calls[0]?.args[0].input as GetObjectCommandInput;
        expect(input.Bucket).toEqual(EXPECTED_BUCKET_NAME);
        expect(input.Key).toEqual(EXPECTED_KEY);
    });

    test("only calls domain with content related to valid record", async () => {
        await handler(event);

        expect(addItem).toHaveBeenCalledTimes(1);
        expect(addItem).toHaveBeenCalledWith(EXPECTED_CONTENT);
    });
});

describe("error handling", () => {
    const event = createS3Event([validRecord]);

    beforeEach(() => {
        const output = mock<GetObjectCommandOutput>();
        output.Body = sdkStreamMixin(Readable.from([EXPECTED_CONTENT]));
        mockS3Client.on(GetObjectCommand).resolves(output);
    });

    test("throws an error if the seed key is not configured", async () => {
        delete process.env[EXPECTED_PROCESS_SEED_KEY];
        const expectedError = new Error(
            `Missing ${EXPECTED_PROCESS_SEED_KEY} environment variable`
        );

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrowError(expectedError);
    });

    test("throws an error if an unhandled exception occurs when fetching S3 content", async () => {
        const expectedError = new Error("test S3 error");
        mockS3Client.on(GetObjectCommand).rejects(expectedError);

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrowError(expectedError);
    });

    test("throws an error if an unhandled exception occurs when adding item", async () => {
        const expectedError = new Error("test error");
        mockAddItem.mockRejectedValue(expectedError);

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrowError(expectedError);
    });

    test("throws an error if the item could not be added", async () => {
        const expectedError = new Error("Failed to add new items");
        mockAddItem.mockResolvedValue(false);

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrowError(expectedError);
    });
});
