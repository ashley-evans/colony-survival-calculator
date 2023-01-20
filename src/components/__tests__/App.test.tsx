import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";

import { waitForRequest } from "../../helpers/utils";
import App from "../App";
import { Items } from "../../types";

const STATIC_ITEMS_PATH = "json/items.json";
const VALID_ITEMS: Items = [
    { name: "Test Item 1", createTime: 2 },
    { name: "Test Item 2", createTime: 4 },
];

const server = setupServer(
    rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
        return res(ctx.json(VALID_ITEMS));
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

describe("output selector", () => {
    test("fetches all known static items", async () => {
        const expectedRequest = waitForRequest(
            server,
            "GET",
            STATIC_ITEMS_PATH
        );

        render(<App />);

        await expect(expectedRequest).resolves.not.toThrowError();
    });

    test("renders desired output header", async () => {
        const expectedHeader = "Desired output:";

        render(<App />);

        expect(
            await screen.findByRole("heading", { name: expectedHeader })
        ).toBeVisible();
    });

    test.each([
        ["no static items returned", []],
        ["invalid static items returned", [{ invalid: "invalid" }]],
    ])(
        "renders a missing known items error if %s",
        async (_: string, items) => {
            server.use(
                rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
                    return res(ctx.json(items));
                })
            );

            const expectedError = "Error: Unable to fetch known items";

            render(<App />);

            expect(await screen.findByRole("alert")).toHaveTextContent(
                expectedError
            );
        }
    );

    test("does not render a missing known items if static items are returned", async () => {
        const expectedRequest = waitForRequest(
            server,
            "GET",
            STATIC_ITEMS_PATH
        );
        const errorMessage = "Error: Unable to fetch known items";

        render(<App />);
        await waitFor(() => expectedRequest);

        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
});

afterAll(() => {
    server.close();
});
