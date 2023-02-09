import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProviderProps, RouterProvider } from "react-router-dom";

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

export { renderWithRouterProvider };
