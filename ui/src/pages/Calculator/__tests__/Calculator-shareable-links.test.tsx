import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, graphql } from "msw";
import { setupServer } from "msw/node";
import { vi } from "vitest";

import {
    clickByName,
    createRequirement,
    createRequirementCreator,
    expectedCreatorOverrideQueryName,
    expectedCreatorSelectOverrideLabel,
    expectedEyeglassesCheckboxLabel,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
    expectedItemSelectLabel,
    expectedItemSelectOverrideLabel,
    expectedMachineToolCheckboxLabel,
    expectedOutputUnitLabel,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    expectedTargetAmountInputLabel,
    expectedToolSelectLabel,
    generateItemCreatorOverridesResponse,
} from "./utils";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";
import { renderWithRouterProvider } from "../../../test";
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

// Decided: write continuously as the user makes changes, rather than a separate share button. Some advice to self on doing this properly:
// - Read must only happen once (a useState lazy initializer off the URL on mount), not a useEffect reacting to searchParams - otherwise write updating the URL triggers read again, which sets state, which triggers write again, infinite loop
// - Always write via setSearchParams with { replace: true }, never the push default - otherwise every keystroke/toggle pushes a new history entry and the back button becomes useless after a few edits
// - Follow the same only-write-target-amount approach as read (never write both amount and workers at once, matches the derive-from-amount precedence decided for read)
// - Only write params that are actually set / differ from default, don't pad the URL with every field at its default value - also means clearing a field should delete the param rather than writing it empty, so the URL round-trips cleanly
// - Debounce the numeric inputs before writing (amount/workers) - otherwise typing "10" replaces history with "1" then "10", and it's a lot of churn for no benefit
// - Write booleans as exactly "true"/"false" to match what read now expects, not "1"/"0" or omitting the key on false - keep the two directions symmetric so round-tripping a shared link doesn't silently drift
// - Creator overrides need the same getAll("co") shape on the way out (repeat co={itemID}:{creatorID} per override) as on the way in
