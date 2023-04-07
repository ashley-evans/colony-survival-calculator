import { DefaultBodyType, matchRequestUrl, MockedRequest } from "msw";
import { SetupServer } from "msw/lib/node";

type GraphQLOperationBody<Arguments> = {
    operationName: string;
    variables: Arguments;
};

type RequestListenerResponse = {
    matchedRequest: MockedRequest;
};

type RequestListenerResponseWithDetails<Arguments> = RequestListenerResponse & {
    matchedRequestDetails: GraphQLOperationBody<Arguments>;
    detailsUpToMatch: GraphQLOperationBody<Arguments>[];
};

async function getQueryDetails<Arguments>(
    req: MockedRequest<DefaultBodyType>
): Promise<GraphQLOperationBody<Arguments> | undefined> {
    try {
        return await req.json();
    } catch {
        return undefined;
    }
}

function waitForRequest(
    server: SetupServer,
    method: string,
    url: string
): Promise<RequestListenerResponse>;
function waitForRequest<Arguments>(
    server: SetupServer,
    method: string,
    url: string,
    operationName?: string,
    requiredArguments?: Arguments
): Promise<RequestListenerResponseWithDetails<Arguments>>;
function waitForRequest<Arguments>(
    server: SetupServer,
    method: string,
    url: string,
    operationName?: string,
    requiredArguments?: Arguments
): Promise<
    RequestListenerResponse | RequestListenerResponseWithDetails<Arguments>
> {
    const matchingRequestDetails: GraphQLOperationBody<Arguments>[] = [];
    let requestId = "";
    let requestDetails: GraphQLOperationBody<Arguments> | undefined;

    return new Promise((resolve, reject) => {
        server.events.on("request:start", async (req) => {
            const matchesMethod =
                req.method.toLowerCase() === method.toLowerCase();

            const matchesUrl = matchRequestUrl(req.url, url).matches;

            let matchesOperationName = true;
            let matchesArguments = true;
            let details: GraphQLOperationBody<Arguments> | undefined;
            if (operationName) {
                details = await getQueryDetails<Arguments>(req);
                matchesOperationName = operationName === details?.operationName;

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
                requestId = req.id;
                requestDetails = details;
            }
        });

        server.events.on("request:match", (req) => {
            if (req.id === requestId) {
                const result: RequestListenerResponse = {
                    matchedRequest: req,
                };

                if (requestDetails) {
                    resolve({
                        ...result,
                        matchedRequestDetails: requestDetails,
                        detailsUpToMatch: matchingRequestDetails.slice(
                            0,
                            matchingRequestDetails.length - 1
                        ),
                    });
                }

                resolve(result);
            }
        });

        server.events.on("request:unhandled", (req) => {
            if (req.id === requestId) {
                reject(
                    new Error(
                        `The ${req.method} ${req.url.href} request was unhandled.`
                    )
                );
            }
        });
    });
}

export { waitForRequest };
