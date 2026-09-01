import { HttpResponse, graphql } from "msw";
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
    selectItemAndTarget,
    selectTool,
    expectedCreatorOverrideQueryName,
    expectedCalculatorOutputQueryName,
    expectedMachineToolCheckboxLabel,
    expectedEyeglassesCheckboxLabel,
    createRequirement,
    createRequirementCreator,
    expectedRequirementsHeading,
} from "./utils";
import {
    click,
    openSelectMenu,
    renderWithTestProviders as render,
} from "../../../test/utils";
import Calculator from "../Calculator";
import { waitForRequest } from "../../../helpers/utils";
import {
    OutputUnit,
    AvailableDefaultTools,
} from "../../../graphql/__generated__/schema-types";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const item: ItemName = { id: "item1", name: "Item 1" };

const server = setupServer(
    graphql.query(expectedItemNameQueryName, () => {
        return HttpResponse.json({
            data: {
                distinctItemNames: [item],
            },
        });
    }),
    graphql.query(expectedItemDetailsQueryName, () => {
        return HttpResponse.json({
            data: {
                item: [],
            },
        });
    }),
    createCalculatorOutputResponseHandler([
        createRequirement({
            name: item.name,
            amount: 1,
            creators: [
                createRequirementCreator({
                    recipeName: item.name,
                    workers: 1,
                    amount: 1,
                    creator: "Creator",
                    demands: [],
                }),
            ],
        }),
    ]),
    graphql.query(expectedCreatorOverrideQueryName, () => {
        return HttpResponse.json({ data: { item: [] } });
    }),
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
        await screen.findByRole("combobox", { name: expectedToolSelectLabel }),
    ).toBeVisible();
});

test.each(["None", "Stone", "Copper", "Iron", "Bronze", "Steel"])(
    "renders the %s tool option in the tool selector",
    async (tool: string) => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await openSelectMenu({ label: expectedToolSelectLabel });

        expect(await screen.findByRole("option", { name: tool })).toBeVisible();
    },
);

test("renders the tool options in order of unlock", async () => {
    render(<Calculator />);
    await openSelectMenu({ label: expectedToolSelectLabel });

    const toolOptions = await screen.findAllByRole("option");
    expect(toolOptions).toHaveLength(6);
    expect(toolOptions[0]).toHaveAccessibleName("None");
    expect(toolOptions[1]).toHaveAccessibleName("Stone");
    expect(toolOptions[2]).toHaveAccessibleName("Copper");
    expect(toolOptions[3]).toHaveAccessibleName("Iron");
    expect(toolOptions[4]).toHaveAccessibleName("Bronze");
    expect(toolOptions[5]).toHaveAccessibleName("Steel");
});

test("renders none as the selected tool by default", async () => {
    const expected = "None";

    render(<Calculator />);
    await openSelectMenu({ label: expectedToolSelectLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedToolSelectLabel }),
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", { name: expected, selected: true }),
    ).toBeVisible();
});

test("updates the selected tool if selected is changed", async () => {
    const expected = "Iron";

    render(<Calculator />);
    await selectTool(AvailableDefaultTools.Iron);
    await openSelectMenu({ label: expectedToolSelectLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedToolSelectLabel }),
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        }),
    ).toBeVisible();
});

test("queries calculator with provided tool if non default selected", async () => {
    const expectedTool = AvailableDefaultTools.Steel;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(expectedTool);
    await selectItemAndTarget({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await screen.findByRole("heading", {
        name: expectedRequirementsHeading,
    });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        id: item.id,
        amount: null,
        workers: expectedWorkers,
        unit: OutputUnit.Minutes,
        availableTools: {
            default: expectedTool,
            machine: false,
            eyeglasses: false,
        },
        locale: "en-US",
    });
});

test("queries optimal output again if tool is changed after first query", async () => {
    const expectedTool = AvailableDefaultTools.Copper;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
        {
            id: item.id,
            amount: null,
            workers: expectedWorkers,
            unit: OutputUnit.Minutes,
            availableTools: {
                default: expectedTool,
                machine: false,
                eyeglasses: false,
            },
            locale: "en-US",
        },
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(AvailableDefaultTools.Steel);
    await selectItemAndTarget({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await selectTool(expectedTool);
    await screen.findByRole("heading", {
        name: expectedRequirementsHeading,
    });

    await expect(expectedRequest).resolves.not.toThrow();
});

test("queries requirements with provided tool if non default selected", async () => {
    const expectedTool = AvailableDefaultTools.Steel;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(expectedTool);
    await selectItemAndTarget({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await screen.findByRole("heading", {
        name: expectedRequirementsHeading,
    });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        id: item.id,
        amount: null,
        workers: expectedWorkers,
        availableTools: {
            default: expectedTool,
            machine: false,
            eyeglasses: false,
        },
        unit: OutputUnit.Minutes,
        locale: "en-US",
    });
});

test("queries requirements again if tool is changed after first query", async () => {
    const expectedTool = AvailableDefaultTools.Copper;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
        {
            id: item.id,
            amount: null,
            workers: expectedWorkers,
            unit: OutputUnit.Minutes,
            availableTools: {
                default: expectedTool,
                machine: false,
                eyeglasses: false,
            },
            locale: "en-US",
        },
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(AvailableDefaultTools.Steel);
    await selectItemAndTarget({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await selectTool(expectedTool);
    await screen.findByRole("heading", {
        name: expectedRequirementsHeading,
    });

    await expect(expectedRequest).resolves.not.toThrow();
});

test("queries item details with provided tool if non default selected", async () => {
    const expectedTool = AvailableDefaultTools.Steel;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedItemDetailsQueryName,
        {
            filters: {
                id: item.id,
                optimal: {
                    default: expectedTool,
                    machine: false,
                    eyeglasses: false,
                },
            },
            locale: "en-US",
        },
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(expectedTool);
    await selectItemAndTarget({
        itemName: item.name,
        workers: expectedWorkers,
    });

    await expect(expectedRequest).resolves.not.toThrow();
});

test("queries item details again if tool is changed after first query", async () => {
    const expectedTool = AvailableDefaultTools.Copper;
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedItemDetailsQueryName,
        {
            filters: {
                id: item.id,
                optimal: {
                    default: expectedTool,
                    machine: false,
                    eyeglasses: false,
                },
            },
            locale: "en-US",
        },
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectTool(AvailableDefaultTools.Steel);
    await selectItemAndTarget({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await selectTool(expectedTool);

    await expect(expectedRequest).resolves.not.toThrow();
});

test("does not reset the currently selected tool after changing tabs", async () => {
    const expected = "Iron";

    render(<Calculator />);
    await selectTool(AvailableDefaultTools.Iron);
    await clickByName(expectedSettingsTab, "tab");
    await screen.findByRole("heading", {
        name: expectedSettingsTabHeader,
        level: 2,
    });
    await clickByName(expectedCalculatorTab, "tab");

    expect(
        await screen.findByRole("combobox", { name: expectedToolSelectLabel }),
    ).toHaveTextContent(expected);
});

describe("machine tool selection", () => {
    test("displays an unchecked checkbox to allow machine tool availability indication", async () => {
        render(<Calculator />);

        const checkbox = await screen.findByRole("checkbox", {
            name: expectedMachineToolCheckboxLabel,
        });
        expect(checkbox).toBeVisible();
        expect(checkbox).not.toBeChecked();
    });

    test("machine tool checkbox changes to checked when clicked", async () => {
        render(<Calculator />);
        await click({
            label: expectedMachineToolCheckboxLabel,
            role: "checkbox",
        });

        expect(
            screen.getByRole("checkbox", {
                name: expectedMachineToolCheckboxLabel,
            }),
        ).toBeChecked();
    });

    test("does not reset the machine tool checkbox after changing tabs", async () => {
        render(<Calculator />);
        await click({
            label: expectedMachineToolCheckboxLabel,
            role: "checkbox",
        });
        await clickByName(expectedSettingsTab, "tab");
        await screen.findByRole("heading", {
            name: expectedSettingsTabHeader,
            level: 2,
        });
        await clickByName(expectedCalculatorTab, "tab");

        expect(
            await screen.findByRole("checkbox", {
                name: expectedMachineToolCheckboxLabel,
            }),
        ).toBeChecked();
    });

    test("queries item details with machine tool availability once checked", async () => {
        const expectedWorkers = 5;
        const expectedRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedItemDetailsQueryName,
            {
                filters: {
                    id: item.id,
                    optimal: {
                        default: AvailableDefaultTools.None,
                        machine: true,
                        eyeglasses: false,
                    },
                },
                locale: "en-US",
            },
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndTarget({
            itemName: item.name,
            workers: expectedWorkers,
        });
        await click({
            label: expectedMachineToolCheckboxLabel,
            role: "checkbox",
        });

        await expect(expectedRequest).resolves.not.toThrow();
    });
});

describe("eyeglasses selection", () => {
    test("displays an unchecked checkbox to allow eyeglasses availability indication", async () => {
        render(<Calculator />);

        const checkbox = await screen.findByRole("checkbox", {
            name: expectedEyeglassesCheckboxLabel,
        });
        expect(checkbox).toBeVisible();
        expect(checkbox).not.toBeChecked();
    });

    test("eyeglasses checkbox changes to checked when clicked", async () => {
        render(<Calculator />);
        await click({
            label: expectedEyeglassesCheckboxLabel,
            role: "checkbox",
        });

        expect(
            screen.getByRole("checkbox", {
                name: expectedEyeglassesCheckboxLabel,
            }),
        ).toBeChecked();
    });

    test("does not reset the eyeglasses checkbox after changing tabs", async () => {
        render(<Calculator />);
        await click({
            label: expectedEyeglassesCheckboxLabel,
            role: "checkbox",
        });
        await clickByName(expectedSettingsTab, "tab");
        await screen.findByRole("heading", {
            name: expectedSettingsTabHeader,
            level: 2,
        });
        await clickByName(expectedCalculatorTab, "tab");

        expect(
            await screen.findByRole("checkbox", {
                name: expectedEyeglassesCheckboxLabel,
            }),
        ).toBeChecked();
    });

    test("queries item details with eyeglasses availability once checked", async () => {
        const expectedWorkers = 5;
        const expectedRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedItemDetailsQueryName,
            {
                filters: {
                    id: item.id,
                    optimal: {
                        default: AvailableDefaultTools.None,
                        machine: false,
                        eyeglasses: true,
                    },
                },
                locale: "en-US",
            },
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndTarget({
            itemName: item.name,
            workers: expectedWorkers,
        });
        await click({
            label: expectedEyeglassesCheckboxLabel,
            role: "checkbox",
        });

        await expect(expectedRequest).resolves.not.toThrow();
    });
});

afterAll(() => {
    server.close();
});
