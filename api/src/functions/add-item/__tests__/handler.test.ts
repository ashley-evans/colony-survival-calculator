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

import { handler } from "../handler";

const mockS3Client = mockClient(S3Client);

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
});

const EXPECTED_BUCKET_NAME = "test_bucket_name";
const EXPECTED_KEY = "seeds/items.json";

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
    (addItem as jest.Mock).mockReset();
});

test.each([
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
])(
    "throws an error if an event with %s",
    async (_: string, records?: S3EventRecord[]) => {
        const event = createS3Event(records);

        expect.assertions(1);
        await expect(handler(event)).rejects.toMatchSnapshot();
    }
);

describe("handles valid item list create events", () => {
    const event = createS3Event([validRecord]);
    const expectedContent = '{ "test": "content" }';

    beforeEach(() => {
        const output = mock<GetObjectCommandOutput>();
        output.Body = sdkStreamMixin(Readable.from([expectedContent]));
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
        expect(addItem).toHaveBeenCalledWith(expectedContent);
    });

    test("does not call domain if no content returned", async () => {
        mockS3Client.on(GetObjectCommand).resolves({ Body: undefined });

        await handler(event);

        expect(addItem).toHaveBeenCalledTimes(0);
    });
});

test("does not call S3 if given a valid event with a unknown object key", async () => {
    const record = createValidEventRecord("unexpected");
    const event = createS3Event([record]);

    await handler(event);

    const calls = mockS3Client.commandCalls(GetObjectCommand);
    expect(calls).toHaveLength(0);
});
