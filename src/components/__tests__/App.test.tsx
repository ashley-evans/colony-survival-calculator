import React from "react";
import { render, screen } from "@testing-library/react";

import App from "../App";

test("renders application header", async () => {
    const expectedHeader = "Colony Survival Calculator";

    render(<App />);

    expect(
        await screen.findByRole("heading", { name: expectedHeader })
    ).toBeVisible();
});
