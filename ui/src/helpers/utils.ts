import { DefaultBodyType, matchRequestUrl, MockedRequest } from "msw";
import { SetupServer } from "msw/lib/node";

type GraphQLOperationBody<Arguments> = {
    operationName: string;
    variables: Arguments;
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
): Promise<MockedRequest>;
function waitForRequest<Arguments>(
    server: SetupServer,
    method: string,
    url: string,
    operationName?: string
): Promise<[MockedRequest, GraphQLOperationBody<Arguments> | undefined]>;
function waitForRequest<Arguments>(
    server: SetupServer,
    method: string,
    url: string,
    operationName?: string
): Promise<
    MockedRequest | [MockedRequest, GraphQLOperationBody<Arguments> | undefined]
> {
    let requestId = "";
    let requestDetails: GraphQLOperationBody<Arguments> | undefined;

    return new Promise((resolve, reject) => {
        server.events.on("request:start", async (req) => {
            const matchesMethod =
                req.method.toLowerCase() === method.toLowerCase();

            const matchesUrl = matchRequestUrl(req.url, url).matches;

            let matchesOperationName = true;
            let details: GraphQLOperationBody<Arguments> | undefined;
            if (operationName) {
                details = await getQueryDetails<Arguments>(req);
                matchesOperationName = operationName === details?.operationName;
            }

            if (matchesMethod && matchesUrl && matchesOperationName) {
                requestId = req.id;
                requestDetails = details;
            }
        });

        server.events.on("request:match", (req) => {
            if (req.id === requestId) {
                if (requestDetails) {
                    resolve([req, requestDetails]);
                }

                resolve(req);
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
