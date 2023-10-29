import React from "react";
import { graphql } from "msw";
import { setupServer } from "msw/node";
import { screen } from "@testing-library/react";

import {
    ItemName,
    expectedCalculatorTab,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    expectedToolSelectLabel,
    clickByName,
    selectItemAndWorkers,
    selectTool,
    expectedCreatorOverrideQueryName,
    expectedCalculatorOutputQueryName,
} from "./utils";
import {
    openSelectMenu,
    renderWithTestProviders as render,
} from "../../../test/utils";
import Calculator from "../Calculator";
import { waitForRequest } from "../../../helpers/utils";
import {
    OutputUnit,
    AvailableTools,
} from "../../../graphql/__generated__/graphql";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const item: ItemName = { name: "Item 1" };

const server = setupServer(
    graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
        return res(ctx.data({ distinctItemNames: [item.name] }));
    }),
    graphql.query(expectedItemDetailsQueryName, (_, res, ctx) => {
        return res(ctx.data({ item: [] }));
    }),
    createCalculatorOutputResponseHandler([], 5.2),
    graphql.query(expectedCreatorOverrideQueryName, (_, res, ctx) => {
        return res(
            ctx.data({
                item: [],
            })
        );
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
        await openSelectMenu({ label: expectedToolSelectLabel });

        expect(await screen.findByRole("option", { name: tool })).toBeVisible();
    }
);

test("renders none as the selected tool by default", async () => {
    const expected = "None";

    render(<Calculator />);
    await openSelectMenu({ label: expectedToolSelectLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedToolSelectLabel })
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", { name: expected, selected: true })
    ).toBeVisible();
});

test("updates the selected tool if selected is changed", async () => {
    const expected = "Iron";

    render(<Calculator />);
    await selectTool(AvailableTools.Iron);
    await openSelectMenu({ label: expectedToolSelectLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedToolSelectLabel })
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        })
    ).toBeVisible();
});

test("queries calculator with provided tool if non default selected", async () => {
    const expectedTool = AvailableTools.Steel;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName
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
    const expectedTool = AvailableTools.Copper;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
        {
            name: item.name,
            workers: expectedWorkers,
            unit: OutputUnit.Minutes,
            maxAvailableTool: expectedTool,
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(AvailableTools.Steel);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await selectTool(expectedTool);

    await expect(expectedRequest).resolves.not.toThrow();
});

test("queries requirements with provided tool if non default selected", async () => {
    const expectedTool = AvailableTools.Steel;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName
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
        unit: OutputUnit.Minutes,
    });
});

test("queries requirements again if tool is changed after first query", async () => {
    const expectedTool = AvailableTools.Copper;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
        {
            name: item.name,
            workers: expectedWorkers,
            unit: OutputUnit.Minutes,
            maxAvailableTool: expectedTool,
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(AvailableTools.Steel);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await selectTool(expectedTool);

    await expect(expectedRequest).resolves.not.toThrow();
});

test("queries item details with provided tool if non default selected", async () => {
    const expectedTool = AvailableTools.Steel;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedItemDetailsQueryName,
        {
            filters: {
                name: item.name,
                optimal: { maxAvailableTool: expectedTool },
            },
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(expectedTool);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });

    await expect(expectedRequest).resolves.not.toThrow();
});

test("queries item details again if tool is changed after first query", async () => {
    const expectedTool = AvailableTools.Copper;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedItemDetailsQueryName,
        {
            filters: {
                name: item.name,
                optimal: { maxAvailableTool: expectedTool },
            },
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(AvailableTools.Steel);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await selectTool(expectedTool);

    await expect(expectedRequest).resolves.not.toThrow();
});

test("does not reset the currently selected tool after changing tabs", async () => {
    const expected = "Iron";

    render(<Calculator />);
    await selectTool(AvailableTools.Iron);
    await clickByName(expectedSettingsTab, "tab");
    await screen.findByRole("heading", {
        name: expectedSettingsTabHeader,
        level: 2,
    });
    await clickByName(expectedCalculatorTab, "tab");

    expect(
        await screen.findByRole("combobox", { name: expectedToolSelectLabel })
    ).toHaveTextContent(expected);
});

afterAll(() => {
    server.close();
});
