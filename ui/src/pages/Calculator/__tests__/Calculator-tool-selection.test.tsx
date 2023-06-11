import React from "react";
import { graphql } from "msw";
import { setupServer } from "msw/node";
import { screen } from "@testing-library/react";

import {
    ItemName,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
    expectedOutputQueryName,
    expectedRequirementsQueryName,
    expectedToolSelectLabel,
    openSelectMenu,
    selectItemAndWorkers,
    selectTool,
} from "./utils";
import { renderWithTestProviders as render } from "../../../test/utils";
import Calculator from "../Calculator";
import { waitForRequest } from "../../../helpers/utils";
import { OutputUnit, Tools } from "../../../graphql/__generated__/graphql";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const item: ItemName = { name: "Item 1" };

const server = setupServer(
    graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
        return res(ctx.data({ distinctItemNames: [item.name] }));
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
        await openSelectMenu({ selectLabel: expectedToolSelectLabel });

        expect(await screen.findByRole("option", { name: tool })).toBeVisible();
    }
);

test("renders none as the selected tool by default", async () => {
    render(<Calculator />);
    await openSelectMenu({ selectLabel: expectedToolSelectLabel });

    expect(
        await screen.findByRole("option", { name: "None", selected: true })
    ).toBeVisible();
});

test("queries optimal output with provided tool if non default selected", async () => {
    const expectedTool = Tools.Steel;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedOutputQueryName
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(expectedTool);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        name: item.name,
        workers: expectedWorkers,
        unit: OutputUnit.Minutes,
        maxAvailableTool: expectedTool,
    });
});

test("queries optimal output again if tool is changed after first query", async () => {
    const expectedTool = Tools.Copper;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedOutputQueryName,
        {
            name: item.name,
            workers: expectedWorkers,
            unit: OutputUnit.Minutes,
            maxAvailableTool: expectedTool,
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(Tools.Steel);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await selectTool(expectedTool);

    await expect(expectedRequest).resolves.not.toThrow();
});

test("queries requirements with provided tool if non default selected", async () => {
    const expectedTool = Tools.Steel;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedRequirementsQueryName
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(expectedTool);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        name: item.name,
        workers: expectedWorkers,
        maxAvailableTool: expectedTool,
    });
});

test("queries requirements again if tool is changed after first query", async () => {
    const expectedTool = Tools.Copper;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedRequirementsQueryName,
        {
            name: item.name,
            workers: expectedWorkers,
            maxAvailableTool: expectedTool,
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(Tools.Steel);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await selectTool(expectedTool);

    await expect(expectedRequest).resolves.not.toThrow();
});

afterAll(() => {
    server.close();
});