import React, { ReactElement } from "react";
import { render } from "@testing-library/react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "styled-components";

import { darkTheme } from "../routes/components/SiteLayout/theme";
import {
    ApolloClient,
    ApolloProvider,
    HttpLink,
    InMemoryCache,
    NormalizedCacheObject,
} from "@apollo/client";
import AppRouterProvider, {
    AppRouterProviderProps,
} from "../routes/AppRouterProvider";

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

function wrapWithTestProviders(
    children: ReactElement,
    apiURL = defaultGraphQLURL
) {
    const client = createApolloClient(apiURL);

    return (
        <ApolloProvider client={client}>
            <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
        </ApolloProvider>
    );
}

function renderWithRouterProvider(
    routerProps: AppRouterProviderProps = {},
    apiURL = defaultGraphQLURL
) {
    const client = createApolloClient(apiURL);

    return {
        user: userEvent.setup(),
        ...render(
            <ApolloProvider client={client}>
                <AppRouterProvider {...routerProps} />
            </ApolloProvider>
        ),
    };
}

function renderWithTestProviders(
    children: ReactElement,
    apiURL = defaultGraphQLURL
) {
    return {
        ...render(wrapWithTestProviders(children, apiURL)),
    };
}

async function clickButton({ label }: { label: string }): Promise<void> {
    const user = userEvent.setup();
    const button = await screen.findByRole("button", { name: label });

    await act(async () => {
        await user.click(button);
    });
}

export {
    wrapWithTestProviders,
    renderWithRouterProvider,
    renderWithTestProviders,
    clickButton,
};
