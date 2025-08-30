import React from "react";
import ReactDOM from "react-dom/client";
import "normalize.css";
import { Amplify } from "aws-amplify";
import { ApolloProvider } from "@apollo/client";

import RouterProvider from "./routes/AppRouterProvider";

const region = import.meta.env.VITE_AWS_REGION;

Amplify.configure({
    Auth: {
        Cognito: {
            identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
            allowGuestAccess: true,
        },
    },
});

import { createClient } from "./clients/aws-appsync-client-factory";

const client = createClient(import.meta.env.VITE_GRAPHQL_API_URL, region);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ApolloProvider client={client}>
            <RouterProvider />
        </ApolloProvider>
    </React.StrictMode>,
);
