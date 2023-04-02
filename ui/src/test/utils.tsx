import React, { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProviderProps, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import { darkTheme } from "../routes/components/SiteLayout/theme";
import {
    ApolloClient,
    ApolloProvider,
    HttpLink,
    InMemoryCache,
    NormalizedCacheObject,
} from "@apollo/client";

const defaultGraphQLURL = "https://localhost:3000/graphql";

function createApolloClient(
    apiURL: string
): ApolloClient<NormalizedCacheObject> {
    const httpLink = new HttpLink({ uri: apiURL });
    return new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache(),
    });
}

function renderWithRouterProvider(
    routerProps: RouterProviderProps,
    route = "/",
    apiURL = defaultGraphQLURL
) {
    const client = createApolloClient(apiURL);
    routerProps.router.navigate(route);

    return {
        user: userEvent.setup(),
        ...render(
            <ApolloProvider client={client}>
                <RouterProvider {...routerProps} />
            </ApolloProvider>
        ),
    };
}

function renderWithTestProviders(
    children: ReactElement,
    apiURL = defaultGraphQLURL
) {
    const client = createApolloClient(apiURL);

    return {
        ...render(
            <ApolloProvider client={client}>
                <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
            </ApolloProvider>
        ),
    };
}

export { renderWithRouterProvider, renderWithTestProviders };
