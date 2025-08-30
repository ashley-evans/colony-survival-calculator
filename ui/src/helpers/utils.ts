import { DefaultBodyType, StrictRequest } from "msw";
import { SetupServer } from "msw/lib/node";

type GraphQLOperationBody<Arguments extends DefaultBodyType> = {
    operationName: string;
    variables: Arguments;
};

type RequestListenerResponse<T extends DefaultBodyType> = {
    matchedRequest: StrictRequest<T>;
};

type RequestListenerResponseWithDetails<Arguments extends DefaultBodyType> =
    RequestListenerResponse<Arguments> & {
        matchedRequestDetails: GraphQLOperationBody<Arguments>;
        detailsUpToMatch: GraphQLOperationBody<Arguments>[];
    };

async function getQueryDetails<Arguments extends DefaultBodyType>(
    req: StrictRequest<GraphQLOperationBody<Arguments>>,
): Promise<GraphQLOperationBody<Arguments> | undefined | null> {
    try {
        return req.clone().json();
    } catch {
        return undefined;
    }
}

function waitForRequest(
    server: SetupServer,
    method: string,
    url: string,
): Promise<RequestListenerResponse<DefaultBodyType>>;
function waitForRequest<Arguments extends DefaultBodyType>(
    server: SetupServer,
    method: string,
    url: string,
    operationName?: string,
    requiredArguments?: Arguments,
): Promise<RequestListenerResponseWithDetails<Arguments>>;
function waitForRequest<Arguments extends DefaultBodyType>(
    server: SetupServer,
    method: string,
    url: string,
    operationName?: string,
    requiredArguments?: Arguments,
): Promise<
    | RequestListenerResponse<DefaultBodyType>
    | RequestListenerResponseWithDetails<Arguments>
> {
    const matchingRequestDetails: GraphQLOperationBody<Arguments>[] = [];
    let requestId = "";
    let requestDetails: GraphQLOperationBody<Arguments> | undefined | null;

    return new Promise((resolve, reject) => {
        server.events.on(
            "request:start",
            async ({ request, requestId: currentRequestId }) => {
                const matchesMethod =
                    request.method.toLowerCase() === method.toLowerCase();
                const matchesUrl = request.url == url;

                let matchesOperationName = true;
                let matchesArguments = true;
                let details: GraphQLOperationBody<Arguments> | undefined | null;
                if (operationName) {
                    details = await getQueryDetails<Arguments>(request);
                    matchesOperationName =
                        operationName === details?.operationName;

                    if (requiredArguments && details) {
                        matchesArguments =
                            JSON.stringify(requiredArguments) ==
                            JSON.stringify(details.variables);

                        matchingRequestDetails.push(details);
                    }
                }

                if (
                    matchesMethod &&
                    matchesUrl &&
                    matchesOperationName &&
                    matchesArguments
                ) {
                    requestId = currentRequestId;
                    requestDetails = details;
                }
            },
        );

        server.events.on(
            "request:match",
            ({ request, requestId: currentRequestId }) => {
                if (currentRequestId === requestId) {
                    if (requestDetails) {
                        const result: RequestListenerResponse<Arguments> = {
                            matchedRequest: request,
                        };

                        resolve({
                            ...result,
                            matchedRequestDetails: requestDetails,
                            detailsUpToMatch: matchingRequestDetails.slice(
                                0,
                                matchingRequestDetails.length - 1,
                            ),
                        });
                    }

                    resolve({ matchedRequest: request });
                }
            },
        );

        server.events.on(
            "request:unhandled",
            ({ requestId: currentRequestId, request }) => {
                if (currentRequestId === requestId) {
                    const url = new URL(request.url);
                    reject(
                        new Error(
                            `The ${request.method} ${url.href} request was unhandled.`,
                        ),
                    );
                }
            },
        );
    });
}

export { waitForRequest };
