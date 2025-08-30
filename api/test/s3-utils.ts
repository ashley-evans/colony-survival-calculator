import type { S3Event, S3EventRecord } from "aws-lambda";
import { mock } from "vitest-mock-extended";

export function createS3EventBucketDetails(
    name?: string,
): S3EventRecord["s3"]["bucket"] {
    const bucketDetails = mock<S3EventRecord["s3"]["bucket"]>();
    if (name) {
        bucketDetails.name = name;
    }

    return bucketDetails;
}

export function createS3EventBucketObjectDetails(
    key?: string,
): S3EventRecord["s3"]["object"] {
    const objectDetails = mock<S3EventRecord["s3"]["object"]>();
    if (key) {
        objectDetails.key = key;
    }

    return objectDetails;
}

export function createS3EventNotificationDetails(
    bucketDetails?: S3EventRecord["s3"]["bucket"],
    objectDetails?: S3EventRecord["s3"]["object"],
): S3EventRecord["s3"] {
    const notificationDetails = mock<S3EventRecord["s3"]>();
    if (bucketDetails) {
        notificationDetails.bucket = bucketDetails;
    }

    if (objectDetails) {
        notificationDetails.object = objectDetails;
    }

    return notificationDetails;
}

export function createS3EventRecord(
    details?: S3EventRecord["s3"],
): S3EventRecord {
    const record = mock<S3EventRecord>();
    if (details) {
        record.s3 = details;
    }

    return record;
}

export function createS3Event(records?: S3EventRecord[]): S3Event {
    const event = mock<S3Event>();
    if (records) {
        event.Records = records;
    }

    return event;
}
