import { DefaultBodyType, matchRequestUrl, MockedRequest } from "msw";
import { SetupServer } from "msw/lib/node";

async function getOperationName(
    req: MockedRequest<DefaultBodyType>
): Promise<string | undefined> {
    try {
        const body = await req.json();
        return body.operationName;
    } catch {
        return undefined;
    }
}

function waitForRequest(
    server: SetupServer,
    method: string,
    url: string,
    operationName?: string
): Promise<MockedRequest> {
    let requestId = "";

    return new Promise((resolve, reject) => {
        server.events.on("request:start", async (req) => {
            const matchesMethod =
                req.method.toLowerCase() === method.toLowerCase();

            const matchesUrl = matchRequestUrl(req.url, url).matches;

            let matchesOperationName = true;
            if (operationName) {
                const requestOperation = await getOperationName(req);
                matchesOperationName = operationName === requestOperation;
            }

            if (matchesMethod && matchesUrl && matchesOperationName) {
                requestId = req.id;
            }
        });

        server.events.on("request:match", (req) => {
            if (req.id === requestId) {
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
