import type { AppSyncResolverEvent } from "aws-lambda";

interface GraphQLEventHandler<Arguments, Response> {
    (event: AppSyncResolverEvent<Arguments>): Promise<Response>;
}

export type { GraphQLEventHandler };
