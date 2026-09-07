import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, graphql } from "msw";
import { setupServer } from "msw/node";
import { vi } from "vitest";

import {
    clickByName,
    createRequirement,
    createRequirementCreator,
    expectedAddCreatorOverrideButtonText,
    expectedCreatorOverrideQueryName,
    expectedCreatorSelectOverrideLabel,
    expectedEyeglassesCheckboxLabel,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
    expectedItemSelectLabel,
    expectedItemSelectOverrideLabel,
    expectedMachineToolCheckboxLabel,
    expectedOutputUnitLabel,
    expectedRemoveCreatorOverrideButtonText,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    expectedTargetAmountInputLabel,
    expectedToolSelectLabel,
    generateItemCreatorOverridesResponse,
    selectItemAndTarget,
    selectOutputUnit,
    selectTool,
} from "./utils";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";
import {
    clearInput,
    click,
    renderWithRouterProvider,
    selectOption,
} from "../../../test";
import {
    AvailableDefaultTools,
    OutputUnit,
} from "../../../graphql/__generated__/schema-types";

const items = [
    createRequirement({
        name: "Item 1",
        amount: 30,
        creators: [
            createRequirementCreator({
                recipeName: "Item 1",
                amount: 30,
                workers: 20,
            }),
        ],
    }),
    createRequirement({
        name: "Item 2",
        amount: 30,
        creators: [
            createRequirementCreator({
                recipeName: "Item 2",
                amount: 30,
                workers: 20,
            }),
        ],
    }),
];

const expectedCreatorOverrides = items.map((item, index) =>
    generateItemCreatorOverridesResponse(item, 2, index + items.length),
);
const expectedCreatorOverridesResponse = expectedCreatorOverrides.flat();

const server = setupServer(
    graphql.query(expectedItemNameQueryName, () => {
        return HttpResponse.json({
            data: {
                distinctItemNames: items.map((item) => ({
                    id: item.id,
                    name: item.name,
                })),
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
    createCalculatorOutputResponseHandler([items[0]]),
    graphql.query(expectedCreatorOverrideQueryName, () => {
        return HttpResponse.json({
            data: { item: expectedCreatorOverridesResponse },
        });
    }),
);

const mockMatchesMedia = vi.fn();

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: query === mockMatchesMedia(),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })),
});

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
    mockMatchesMedia.mockReturnValue("");
});

test("renders the calculator with the valid item selected if valid item provided in query string", async () => {
    renderWithRouterProvider({ defaultRoute: `/?item=${items[1].id}` });

    await waitFor(() =>
        expect(
            screen.getByRole("combobox", { name: expectedItemSelectLabel }),
        ).toHaveValue(items[1].name),
    );
});

test.each([
    ["no item ID value is provided", ""],
    ["invalid item ID is provided", "unknown"],
])(
    "renders the calculator with no item selected if %s",
    async (_: string, queryItemID: string) => {
        renderWithRouterProvider({ defaultRoute: `/?item=${queryItemID}` });

        expect(
            await screen.findByRole("combobox", {
                name: expectedItemSelectLabel,
            }),
        ).toHaveAttribute(
            "placeholder",
            "Select an item to use in calculations",
        );
    },
);

test.each([
    ["whole number", "9001", "9,001"],
    ["floating point number", "9001.9", "9,001.9"],
])(
    "renders the calculator with the valid (%s) target amount populated if valid target amount provided in query string",
    async (_: string, queryAmount: string, expectedAmount: string) => {
        renderWithRouterProvider({
            defaultRoute: `/?amount=${queryAmount}`,
        });

        await waitFor(() =>
            expect(
                screen.getByLabelText(expectedTargetAmountInputLabel, {
                    selector: "input",
                }),
            ).toHaveValue(expectedAmount),
        );
    },
);

test.each([
    ["no", ""],
    ["an invalid", "wibble"],
])(
    "renders the calculator with no target amount if %s target amount provided in query string",
    async (_: string, queryAmount: string) => {
        renderWithRouterProvider({ defaultRoute: `/?amount=${queryAmount}` });

        expect(
            await screen.findByLabelText(expectedTargetAmountInputLabel, {
                selector: "input",
            }),
        ).toHaveValue("");
    },
);

test.each([
    ["Game days", OutputUnit.GameDays],
    ["Minutes", OutputUnit.Minutes],
    ["Seconds", OutputUnit.Seconds],
])(
    "renders the calculator with %s selected as output unit if provided in query string",
    async (expectedOutputUnit: string, queryOutputUnit: OutputUnit) => {
        renderWithRouterProvider({ defaultRoute: `/?unit=${queryOutputUnit}` });

        expect(
            await screen.findByRole("combobox", {
                name: expectedOutputUnitLabel,
            }),
        ).toHaveTextContent(expectedOutputUnit);
    },
);

test.each([
    ["no", ""],
    ["an invalid", "wibble"],
])(
    "renders the calculator with default output unit (Minutes) if %s output unit provided in query string",
    async (_: string, queryOutputUnit: string) => {
        renderWithRouterProvider({ defaultRoute: `/?unit=${queryOutputUnit}` });

        expect(
            await screen.findByRole("combobox", {
                name: expectedOutputUnitLabel,
            }),
        ).toHaveTextContent("Minutes");
    },
);

test.each([
    ["None", AvailableDefaultTools.None],
    ["Stone", AvailableDefaultTools.Stone],
    ["Copper", AvailableDefaultTools.Copper],
    ["Iron", AvailableDefaultTools.Iron],
    ["Bronze", AvailableDefaultTools.Bronze],
    ["Steel", AvailableDefaultTools.Steel],
])(
    "renders the calculator with %s selected as available tools if provided in query string",
    async (
        expectedAvailableTools: string,
        queryAvailableTools: AvailableDefaultTools,
    ) => {
        renderWithRouterProvider({
            defaultRoute: `/?tools=${queryAvailableTools}`,
        });

        expect(
            await screen.findByRole("combobox", {
                name: expectedToolSelectLabel,
            }),
        ).toHaveTextContent(expectedAvailableTools);
    },
);

test.each([
    ["no", ""],
    ["invalid", "wibble"],
])(
    "renders the calculator with default tools (None) if %s tools provided in query string",
    async (_: string, queryOutputUnit: string) => {
        renderWithRouterProvider({
            defaultRoute: `/?tools=${queryOutputUnit}`,
        });

        expect(
            await screen.findByRole("combobox", {
                name: expectedToolSelectLabel,
            }),
        ).toHaveTextContent("None");
    },
);

test("renders the calculator with machine tools checked if true flag provided in query string", async () => {
    renderWithRouterProvider({
        defaultRoute: "/?machine=true",
    });

    expect(
        await screen.findByRole("checkbox", {
            name: expectedMachineToolCheckboxLabel,
        }),
    ).toBeChecked();
});

test.each([
    ["no", ""],
    ["false", "false"],
    ["invalid", "wibble"],
])(
    "renders the calculator with machine tools unchecked if %s provided as value to machine tools flag in query string",
    async (_: string, queryMachineFlag: string) => {
        renderWithRouterProvider({
            defaultRoute: `/?machine=${queryMachineFlag}`,
        });

        expect(
            await screen.findByRole("checkbox", {
                name: expectedMachineToolCheckboxLabel,
            }),
        ).not.toBeChecked();
    },
);

test("renders the calculator with eye glasses checked if true flag provided in query string", async () => {
    renderWithRouterProvider({
        defaultRoute: "/?eyeglasses=true",
    });

    expect(
        await screen.findByRole("checkbox", {
            name: expectedEyeglassesCheckboxLabel,
        }),
    ).toBeChecked();
});

test.each([
    ["no", ""],
    ["false", "false"],
    ["invalid", "wibble"],
])(
    "renders the calculator with eye glasses unchecked if %s provided as value to eye glasses flag in query string",
    async (_: string, queryEyeglassesFlag: string) => {
        renderWithRouterProvider({
            defaultRoute: `/?eyeglasses=${queryEyeglassesFlag}`,
        });

        expect(
            await screen.findByRole("checkbox", {
                name: expectedEyeglassesCheckboxLabel,
            }),
        ).not.toBeChecked();
    },
);

test("renders the calculator with a single creator override already configured if provided in query string", async () => {
    const override = expectedCreatorOverrides[1][1];

    renderWithRouterProvider({
        defaultRoute: `/?co=${override.id}:${override.creatorID}`,
    });
    await clickByName(expectedSettingsTab, "tab");

    expect(
        await screen.findByRole("combobox", {
            name: expectedItemSelectOverrideLabel,
        }),
    ).toHaveTextContent(override.name);
    expect(
        screen.getByRole("combobox", {
            name: expectedCreatorSelectOverrideLabel,
        }),
    ).toHaveTextContent(override.creator);
});

test("renders the calculator with multiple creator overrides if provided in query string", async () => {
    const firstOverride = expectedCreatorOverrides[1][1];
    const secondOverride = expectedCreatorOverrides[0][1];

    renderWithRouterProvider({
        defaultRoute: `/?co=${firstOverride.id}:${firstOverride.creatorID}&co=${secondOverride.id}:${secondOverride.creatorID}`,
    });
    await clickByName(expectedSettingsTab, "tab");

    const configuredItemOverrides = await screen.findAllByRole("combobox", {
        name: expectedItemSelectOverrideLabel,
    });
    expect(configuredItemOverrides).toHaveLength(2);
    expect(configuredItemOverrides[0]).toHaveTextContent(firstOverride.name);
    expect(configuredItemOverrides[1]).toHaveTextContent(secondOverride.name);
    const configuredCreatorOverrides = await screen.findAllByRole("combobox", {
        name: expectedCreatorSelectOverrideLabel,
    });
    expect(configuredCreatorOverrides).toHaveLength(2);
    expect(configuredCreatorOverrides[0]).toHaveTextContent(
        firstOverride.creator,
    );
    expect(configuredCreatorOverrides[1]).toHaveTextContent(
        secondOverride.creator,
    );
});

test.each([
    ["no", ""],
    [
        "invalid (unknown item)",
        `unknown:${expectedCreatorOverrides[0][0].creatorID}`,
    ],
    [
        "invalid (incompatible creator)",
        `${expectedCreatorOverrides[0][0].id}:unknown`,
    ],
])(
    "renders the calculator with no configured creator overrides if %s creator override provided in query string",
    async (_: string, queryCreatorOverride: string) => {
        renderWithRouterProvider({
            defaultRoute: `/?co=${queryCreatorOverride}`,
        });
        await clickByName(expectedSettingsTab, "tab");
        await screen.findByRole("heading", {
            name: expectedSettingsTabHeader,
            level: 2,
        });

        expect(
            screen.queryByRole("combobox", {
                name: expectedItemSelectOverrideLabel,
            }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("combobox", {
                name: expectedCreatorSelectOverrideLabel,
            }),
        ).not.toBeInTheDocument();
    },
);

test("renders all calculator state from a query string containing every parameter", async () => {
    const firstOverride = expectedCreatorOverrides[1][1];
    const secondOverride = expectedCreatorOverrides[0][1];

    renderWithRouterProvider({
        defaultRoute:
            `/?item=${items[1].id}` +
            `&amount=9001.9` +
            `&unit=${OutputUnit.Seconds}` +
            `&tools=${AvailableDefaultTools.Steel}` +
            `&machine=true` +
            `&eyeglasses=true` +
            `&co=${firstOverride.id}:${firstOverride.creatorID}` +
            `&co=${secondOverride.id}:${secondOverride.creatorID}`,
    });

    expect(
        await screen.findByRole("combobox", {
            name: expectedItemSelectLabel,
        }),
    ).toHaveValue(items[1].name);
    expect(
        screen.getByLabelText(expectedTargetAmountInputLabel, {
            selector: "input",
        }),
    ).toHaveValue("9,001.9");
    expect(
        screen.getByRole("combobox", { name: expectedOutputUnitLabel }),
    ).toHaveTextContent("Seconds");
    expect(
        screen.getByRole("combobox", { name: expectedToolSelectLabel }),
    ).toHaveTextContent("Steel");
    expect(
        screen.getByRole("checkbox", {
            name: expectedMachineToolCheckboxLabel,
        }),
    ).toBeChecked();
    expect(
        screen.getByRole("checkbox", {
            name: expectedEyeglassesCheckboxLabel,
        }),
    ).toBeChecked();

    await clickByName(expectedSettingsTab, "tab");

    const configuredItemOverrides = await screen.findAllByRole("combobox", {
        name: expectedItemSelectOverrideLabel,
    });
    expect(configuredItemOverrides).toHaveLength(2);
    expect(configuredItemOverrides[0]).toHaveTextContent(firstOverride.name);
    expect(configuredItemOverrides[1]).toHaveTextContent(secondOverride.name);

    const configuredCreatorOverrides = screen.getAllByRole("combobox", {
        name: expectedCreatorSelectOverrideLabel,
    });
    expect(configuredCreatorOverrides).toHaveLength(2);
    expect(configuredCreatorOverrides[0]).toHaveTextContent(
        firstOverride.creator,
    );
    expect(configuredCreatorOverrides[1]).toHaveTextContent(
        secondOverride.creator,
    );
});

test("updates to the target item update the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await selectOption({
        label: expectedItemSelectLabel,
        optionName: items[1].name,
    });

    await waitFor(() =>
        expect(window.location.search).toEqual(`?item=${items[1].id}`),
    );
});

test("updates to the target amount update the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await selectItemAndTarget({ amount: 9001.9 });

    await waitFor(() =>
        expect(window.location.search).toEqual("?amount=9001.9"),
    );
});

test("updates to the output unit update the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await selectOutputUnit(OutputUnit.Seconds);

    await waitFor(() =>
        expect(window.location.search).toEqual(`?unit=${OutputUnit.Seconds}`),
    );
});

test("updates to the available tools update the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await selectTool(AvailableDefaultTools.Steel);

    await waitFor(() =>
        expect(window.location.search).toEqual(
            `?tools=${AvailableDefaultTools.Steel}`,
        ),
    );
});

test("checking the machine tools checkbox updates the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await click({
        label: expectedMachineToolCheckboxLabel,
        role: "checkbox",
    });

    await waitFor(() =>
        expect(window.location.search).toEqual("?machine=true"),
    );
});

test("checking the eye glasses checkbox updates the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await click({
        label: expectedEyeglassesCheckboxLabel,
        role: "checkbox",
    });

    await waitFor(() =>
        expect(window.location.search).toEqual("?eyeglasses=true"),
    );
});

test("configuring a creator override updates the query string parameter", async () => {
    const override = expectedCreatorOverrides[1][1];

    renderWithRouterProvider({ defaultRoute: "/" });
    await clickByName(expectedSettingsTab, "tab");
    await clickByName(expectedAddCreatorOverrideButtonText, "button");
    await selectOption({
        label: expectedItemSelectOverrideLabel,
        optionName: override.name,
    });
    await selectOption({
        label: expectedCreatorSelectOverrideLabel,
        optionName: override.creator,
    });

    await waitFor(() =>
        expect(window.location.search).toEqual(
            `?co=${override.id}%3A${override.creatorID}`,
        ),
    );
});

test("configuring multiple creator overrides updates the query string parameter", async () => {
    const firstOverride = expectedCreatorOverrides[0][0];
    const secondOverride = expectedCreatorOverrides[1][0];

    renderWithRouterProvider({ defaultRoute: "/" });
    await clickByName(expectedSettingsTab, "tab");
    await clickByName(expectedAddCreatorOverrideButtonText, "button");
    await clickByName(expectedAddCreatorOverrideButtonText, "button");

    await waitFor(() =>
        expect(window.location.search).toEqual(
            `?co=${firstOverride.id}%3A${firstOverride.creatorID}` +
                `&co=${secondOverride.id}%3A${secondOverride.creatorID}`,
        ),
    );
});

test("clearing the target amount removes the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await selectItemAndTarget({ amount: 9001.9 });
    await waitFor(() =>
        expect(window.location.search).toEqual("?amount=9001.9"),
    );
    await clearInput({ label: expectedTargetAmountInputLabel });

    await waitFor(() => expect(window.location.search).toEqual(""));
});

test("resetting the output unit to the default removes the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await selectOutputUnit(OutputUnit.Seconds);
    await waitFor(() =>
        expect(window.location.search).toEqual(`?unit=${OutputUnit.Seconds}`),
    );
    await selectOutputUnit(OutputUnit.Minutes);

    await waitFor(() => expect(window.location.search).toEqual(""));
});

test("resetting the available tools to the default removes the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await selectTool(AvailableDefaultTools.Steel);
    await waitFor(() =>
        expect(window.location.search).toEqual(
            `?tools=${AvailableDefaultTools.Steel}`,
        ),
    );
    await selectTool(AvailableDefaultTools.None);

    await waitFor(() => expect(window.location.search).toEqual(""));
});

test("unchecking the machine tools checkbox removes the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await click({ label: expectedMachineToolCheckboxLabel, role: "checkbox" });
    await waitFor(() =>
        expect(window.location.search).toEqual("?machine=true"),
    );
    await click({ label: expectedMachineToolCheckboxLabel, role: "checkbox" });

    await waitFor(() => expect(window.location.search).toEqual(""));
});

test("unchecking the eye glasses checkbox removes the query string parameter", async () => {
    renderWithRouterProvider({ defaultRoute: "/" });

    await click({ label: expectedEyeglassesCheckboxLabel, role: "checkbox" });
    await waitFor(() =>
        expect(window.location.search).toEqual("?eyeglasses=true"),
    );
    await click({ label: expectedEyeglassesCheckboxLabel, role: "checkbox" });

    await waitFor(() => expect(window.location.search).toEqual(""));
});

test("removing a creator override removes the query string parameter", async () => {
    const override = expectedCreatorOverrides[1][1];

    renderWithRouterProvider({ defaultRoute: "/" });
    await clickByName(expectedSettingsTab, "tab");
    await clickByName(expectedAddCreatorOverrideButtonText, "button");
    await selectOption({
        label: expectedItemSelectOverrideLabel,
        optionName: override.name,
    });
    await selectOption({
        label: expectedCreatorSelectOverrideLabel,
        optionName: override.creator,
    });
    await waitFor(() =>
        expect(window.location.search).toEqual(
            `?co=${override.id}%3A${override.creatorID}`,
        ),
    );
    await clickByName(expectedRemoveCreatorOverrideButtonText, "button");

    await waitFor(() => expect(window.location.search).toEqual(""));
});

test("updates to multiple inputs are all reflected together in the query string", async () => {
    const override = expectedCreatorOverrides[1][1];

    renderWithRouterProvider({ defaultRoute: "/" });

    await selectItemAndTarget({ itemName: items[1].name, amount: 9001.9 });
    await selectOutputUnit(OutputUnit.Seconds);
    await selectTool(AvailableDefaultTools.Steel);
    await click({ label: expectedMachineToolCheckboxLabel, role: "checkbox" });
    await click({ label: expectedEyeglassesCheckboxLabel, role: "checkbox" });
    await clickByName(expectedSettingsTab, "tab");
    await clickByName(expectedAddCreatorOverrideButtonText, "button");
    await selectOption({
        label: expectedItemSelectOverrideLabel,
        optionName: override.name,
    });
    await selectOption({
        label: expectedCreatorSelectOverrideLabel,
        optionName: override.creator,
    });

    await waitFor(() => {
        const params = new URLSearchParams(window.location.search);
        expect(params.get("item")).toBe(items[1].id);
        expect(params.get("amount")).toBe("9001.9");
        expect(params.get("unit")).toBe(OutputUnit.Seconds);
        expect(params.get("tools")).toBe(AvailableDefaultTools.Steel);
        expect(params.get("machine")).toBe("true");
        expect(params.get("eyeglasses")).toBe("true");
        expect(params.getAll("co")).toEqual([
            `${override.id}:${override.creatorID}`,
        ]);
    });
});

test("removing one input from a route with many configured parameters only removes that parameter", async () => {
    renderWithRouterProvider({
        defaultRoute:
            `/?item=${items[1].id}` +
            `&amount=9001.9` +
            `&unit=${OutputUnit.Seconds}` +
            `&tools=${AvailableDefaultTools.Steel}` +
            `&machine=true` +
            `&eyeglasses=true`,
    });
    await waitFor(() =>
        expect(
            screen.getByRole("checkbox", {
                name: expectedMachineToolCheckboxLabel,
            }),
        ).toBeChecked(),
    );

    await click({ label: expectedMachineToolCheckboxLabel, role: "checkbox" });

    await waitFor(() => {
        const params = new URLSearchParams(window.location.search);
        expect(params.has("machine")).toBe(false);
        expect(params.get("item")).toBe(items[1].id);
        expect(params.get("amount")).toBe("9001.9");
        expect(params.get("unit")).toBe(OutputUnit.Seconds);
        expect(params.get("tools")).toBe(AvailableDefaultTools.Steel);
        expect(params.get("eyeglasses")).toBe("true");
    });
});

test("updates the query string amount parameter to the computed amount when the worker count is changed", async () => {
    const expectedItem = items[0];

    renderWithRouterProvider({ defaultRoute: "/" });

    await selectItemAndTarget({ itemName: expectedItem.name, workers: 20 });

    await waitFor(() =>
        expect(
            screen.getByLabelText(expectedTargetAmountInputLabel, {
                selector: "input",
            }),
        ).toHaveValue("30"),
    );
    await waitFor(() => {
        const params = new URLSearchParams(window.location.search);
        expect(params.get("item")).toBe(expectedItem.id);
        expect(params.get("amount")).toBe("30");
    });
});
