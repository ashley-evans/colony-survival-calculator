import Ajv, { JSONSchemaType } from "ajv";
import {
    S3Client,
    GetObjectCommand,
    GetObjectCommandInput,
} from "@aws-sdk/client-s3";

import type { S3EventHandler } from "../../interfaces/S3EventHandler";
import { addItem } from "./domain/add-item";

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

const EXPECTED_OBJECT_KEY = "seeds/items.json";

const handler: S3EventHandler<void> = async (event) => {
    if (!event.Records || event.Records.length === 0) {
        throw "No event records provided";
    }

    const record = event.Records[0];
    if (validateEventRecord(record)) {
        if (record.s3.object.key !== EXPECTED_OBJECT_KEY) {
            return;
        }

        const input: GetObjectCommandInput = {
            Key: record.s3.object.key,
            Bucket: record.s3.bucket.name,
        };

        const response = await client.send(new GetObjectCommand(input));
        const body = await response.Body?.transformToString();
        if (body) {
            addItem(body);
        }
    } else {
        throw validateEventRecord.errors;
    }
};

export { handler };
