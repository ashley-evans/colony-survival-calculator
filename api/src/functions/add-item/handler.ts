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

function getSeedKey(): string {
    const processKey = "ITEM_SEED_KEY";
    const key = process.env[processKey];
    if (!key) {
        throw new Error(`Missing ${processKey} environment variable`);
    }

    return key;
}

async function fetchObjectContent(
    key: string,
    bucket: string,
): Promise<string | undefined> {
    const input: GetObjectCommandInput = {
        Key: key,
        Bucket: bucket,
    };

    const response = await client.send(new GetObjectCommand(input));
    return response.Body?.transformToString();
}

const handler: S3EventHandler<void> = async (event) => {
    if (!event.Records || event.Records.length === 0) {
        return;
    }

    const seedKey = getSeedKey();
    const promises = event.Records.map(async (record) => {
        if (validateEventRecord(record)) {
            const key = record.s3.object.key;
            if (key !== seedKey) {
                return;
            }

            const content = await fetchObjectContent(
                key,
                record.s3.bucket.name,
            );
            if (content) {
                const added = await addItem(content);
                if (!added) {
                    throw new Error("Failed to add new items");
                }
            }
        }
    });

    await Promise.all(promises);
};

export { handler };
