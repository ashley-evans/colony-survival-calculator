import React from "react";
import { graphql } from "msw";
import { setupServer } from "msw/node";
import { screen, within } from "@testing-library/react";

import {
    ItemName,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
    expectedOutputQueryName,
    expectedRequirementsQueryName,
    expectedToolSelectLabel,
} from "./utils";
import { renderWithTestProviders as render } from "../../../test/utils";
import Calculator from "../Calculator";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const item: ItemName = { name: "Item 1" };

const server = setupServer(
    graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
        return res(ctx.data({ item: [item] }));
    }),
    graphql.query(expectedItemDetailsQueryName, (_, res, ctx) => {
        return res(ctx.data({ item: [] }));
    }),
    graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
        return res(ctx.data({ requirement: [] }));
    }),
    graphql.query(expectedOutputQueryName, (_, res, ctx) => {
        return res(ctx.data({ output: 5.2 }));
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
    server.events.removeAllListeners();
});

test("renders a select for tools", async () => {
    render(<Calculator />, expectedGraphQLAPIURL);

    expect(
        await screen.findByRole("combobox", { name: expectedToolSelectLabel })
    ).toBeVisible();
});

test.each(["None", "Stone", "Copper", "Iron", "Bronze", "Steel"])(
    "renders the %s tool option in the tool selector",
    async (tool: string) => {
        render(<Calculator />, expectedGraphQLAPIURL);
        const toolSelect = await screen.findByRole("combobox", {
            name: expectedToolSelectLabel,
        });

        expect(
            within(toolSelect).getByRole("option", { name: tool })
        ).toBeInTheDocument();
    }
);

test("renders none as the selected tool by default", async () => {
    render(<Calculator />);
    const toolSelect = await screen.findByRole("combobox", {
        name: expectedToolSelectLabel,
    });

    expect(
        within(toolSelect).getByRole("option", { name: "None", selected: true })
    ).toBeVisible();
});

afterAll(() => {
    server.close();
});
