import React, { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProviderProps, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import { darkTheme } from "../routes/components/SiteLayout/theme";

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

function renderWithThemeProvider(children: ReactElement) {
    return {
        ...render(<ThemeProvider theme={darkTheme}>{children}</ThemeProvider>),
    };
}

export { renderWithRouterProvider, renderWithThemeProvider };
