import type { S3Event } from "aws-lambda";

interface S3EventHandler<Response> {
    (event: S3Event): Promise<Response>;
}

export type { S3EventHandler };
