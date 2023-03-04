import Ajv, { JSONSchemaType } from "ajv";
import {
    S3Client,
    GetObjectCommand,
    GetObjectCommandInput,
} from "@aws-sdk/client-s3";

import type { S3EventHandler } from "../../interfaces/S3EventHandler";

type ValidS3EventRecord = {
    s3: {
        bucket: {
            name: string;
        };
        object: {
            key: string;
        };
    };
};

const eventSchema: JSONSchemaType<ValidS3EventRecord> = {
    type: "object",
    properties: {
        s3: {
            type: "object",
            properties: {
                bucket: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                    },
                    required: ["name"],
                },
                object: {
                    type: "object",
                    properties: {
                        key: { type: "string" },
                    },
                    required: ["key"],
                },
            },
            required: ["bucket", "object"],
        },
    },
    required: ["s3"],
};

const ajv = new Ajv();
const validateEventRecord = ajv.compile<ValidS3EventRecord>(eventSchema);

const client = new S3Client({});

const handler: S3EventHandler<void> = async (event) => {
    if (!event.Records || event.Records.length === 0) {
        throw "No event records provided";
    }

    const record = event.Records[0];
    if (!record) {
        throw "";
    }

    if (validateEventRecord(record)) {
        const input: GetObjectCommandInput = {
            Key: record.s3.object.key,
            Bucket: record.s3.bucket.name,
        };

        await client.send(new GetObjectCommand(input));
    } else {
        throw validateEventRecord.errors;
    }
};

export { handler };
