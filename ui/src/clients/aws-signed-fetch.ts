import { fetchAuthSession } from "aws-amplify/auth";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";

export const createSignedFetch =
    (region: string) =>
    async (input: RequestInfo | URL, init?: RequestInit) => {
        const { credentials } = await fetchAuthSession();
        if (!credentials) {
            throw new Error("No credentials");
        }

        const { accessKeyId, secretAccessKey, sessionToken } = credentials;
        const { host, pathname } = new URL(
            input instanceof Request ? input.url : input,
        );

        const signer = new SignatureV4({
            credentials: {
                accessKeyId,
                secretAccessKey,
                sessionToken,
            },
            region,
            service: "appsync",
            sha256: Sha256,
        });

        const signedRequest = await signer.sign({
            method: init?.method || "POST",
            path: pathname,
            protocol: "https:",
            hostname: host,
            headers: {
                accept: "*/*",
                "content-type": "application/json; charset=UTF-8",
                host,
            },
            body: init?.body,
        });

        return fetch(input, {
            ...init,
            headers: {
                ...init?.headers,
                ...signedRequest.headers,
            },
        });
    };
