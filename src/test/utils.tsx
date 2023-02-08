import React from "react";
import { render } from "@testing-library/react";
import { RouterProviderProps, RouterProvider } from "react-router-dom";

function renderWithRouterProvider(
    routerProps: RouterProviderProps,
    route = "/"
) {
    window.history.pushState({}, "test", route);

    return render(<RouterProvider {...routerProps} />);
}

export { renderWithRouterProvider };
