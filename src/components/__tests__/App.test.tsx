import React from "react";
import { render, screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";

import { waitForRequest } from "./helpers/utils";
import App from "../App";

const expectedItemPath = "json/items.json";

const server = setupServer(
    rest.get(expectedItemPath, (_, res, ctx) => {
        return res(ctx.status(200));
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
});

test("renders application header", async () => {
    const expectedHeader = "Colony Survival Calculator";

    render(<App />);

    expect(
        await screen.findByRole("heading", { name: expectedHeader })
    ).toBeVisible();
});

test("fetches all known static items", async () => {
    const expectedRequest = waitForRequest(server, "GET", "json/items.json");

    render(<App />);

    await expect(expectedRequest).resolves.not.toThrowError();
});

afterAll(() => {
    server.close();
});
