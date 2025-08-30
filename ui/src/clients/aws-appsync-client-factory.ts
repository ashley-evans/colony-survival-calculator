import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { createSignedFetch } from "./aws-signed-fetch";

function createClient(url: string, region: string): ApolloClient {
    const signedFetch = createSignedFetch(region);
    const httpLink = new HttpLink({
        uri: url,
        fetch: signedFetch,
    });

    return new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache(),
    });
}

export { createClient };
