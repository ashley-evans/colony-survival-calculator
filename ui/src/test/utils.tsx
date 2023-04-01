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
} from "@apollo/client";

function renderWithRouterProvider(
    routerProps: RouterProviderProps,
    route = "/"
) {
    routerProps.router.navigate(route);
    return {
        user: userEvent.setup(),
        ...render(<RouterProvider {...routerProps} />),
    };
}

function renderWithTestProviders(
    children: ReactElement,
    apiURL = "https://localhost:3000/graphql"
) {
    const httpLink = new HttpLink({ uri: apiURL });
    const client = new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache(),
    });

    return {
        ...render(
            <ApolloProvider client={client}>
                <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
            </ApolloProvider>
        ),
    };
}

export { renderWithRouterProvider, renderWithTestProviders };
