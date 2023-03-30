import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "normalize.css";
import { Auth } from "@aws-amplify/auth";
import { ApolloProvider } from "@apollo/client";

import router from "./routes/router";

const region = import.meta.env.VITE_AWS_REGION;

Auth.configure({
    region,
    identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
});

import { createClient } from "./clients/aws-appsync-client-factory";

const client = createClient(import.meta.env.VITE_GRAPHQL_API_URL, region);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ApolloProvider client={client}>
            <RouterProvider router={router} />
        </ApolloProvider>
    </React.StrictMode>
);
