import { ReactElement } from "react";
import { ByRoleMatcher, render, within } from "@testing-library/react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "styled-components";

import { darkTheme } from "../routes/components/SiteLayout/theme";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import AppRouterProvider, {
    AppRouterProviderProps,
} from "../routes/AppRouterProvider";

const defaultGraphQLURL = "https://localhost:3000/graphql";

function createApolloClient(apiURL: string): ApolloClient {
    const httpLink = new HttpLink({ uri: apiURL });
    return new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache(),
    });
}

function wrapWithTestProviders(
    children: ReactElement,
    apiURL = defaultGraphQLURL,
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
    apiURL = defaultGraphQLURL,
) {
    const client = createApolloClient(apiURL);

    return {
        user: userEvent.setup(),
        ...render(
            <ApolloProvider client={client}>
                <AppRouterProvider {...routerProps} />
            </ApolloProvider>,
        ),
    };
}

function renderWithTestProviders(
    children: ReactElement,
    apiURL = defaultGraphQLURL,
) {
    return {
        ...render(wrapWithTestProviders(children, apiURL)),
    };
}

async function click({
    label,
    role = "button",
    inside,
}: {
    label: string;
    role?: ByRoleMatcher;
    inside?: HTMLElement;
}): Promise<void> {
    const user = userEvent.setup();
    const container = inside ? within(inside) : screen;
    const button = await container.findByRole(role, { name: label });

    await user.click(button);
}

async function typeValue({
    label,
    value,
}: {
    label: string;
    value: string;
}): Promise<void> {
    const user = userEvent.setup();
    const input = await screen.findByLabelText(label, {
        selector: "input",
    });

    await user.type(input, value);
}

async function clearInput({ label }: { label: string }): Promise<void> {
    const user = userEvent.setup();
    const input = await screen.findByLabelText(label, {
        selector: "input",
    });

    await user.clear(input);
}

async function openSelectMenu({ label }: { label: string }) {
    const user = userEvent.setup();
    const select = await screen.findByRole("combobox", { name: label });

    await user.click(select);
}

async function selectOption({
    optionName,
    label,
}: {
    optionName: string;
    label?: string;
}) {
    if (label) {
        await openSelectMenu({ label });
    }

    const user = userEvent.setup();
    const option = await screen.findByRole("option", { name: optionName });
    await user.click(option);
}

export {
    wrapWithTestProviders,
    renderWithRouterProvider,
    renderWithTestProviders,
    click,
    typeValue,
    clearInput,
    openSelectMenu,
    selectOption,
};
