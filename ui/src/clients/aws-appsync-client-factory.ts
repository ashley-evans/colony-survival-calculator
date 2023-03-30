import {
    ApolloClient,
    ApolloLink,
    HttpLink,
    InMemoryCache,
    NormalizedCacheObject,
} from "@apollo/client";
import { Auth } from "@aws-amplify/auth";
import { createAuthLink, AuthOptions } from "aws-appsync-auth-link";

function createClient(
    url: string,
    region: string
): ApolloClient<NormalizedCacheObject> {
    const authConfiguration: AuthOptions = {
        type: "AWS_IAM",
        credentials: () => Auth.currentCredentials(),
    };

    const httpLink = new HttpLink({ uri: url });
    const link = ApolloLink.from([
        createAuthLink({
            url: url,
            region: region,
            auth: authConfiguration,
        }),
        httpLink,
    ]);

    return new ApolloClient({
        link,
        cache: new InMemoryCache(),
    });
}

export { createClient };
