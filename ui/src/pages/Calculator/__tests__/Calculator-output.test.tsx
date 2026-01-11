import { HttpResponse, graphql } from "msw";
import { setupServer } from "msw/node";
import {
    act,
    screen,
    render as rtlRender,
    waitFor,
} from "@testing-library/react";
import { vi } from "vitest";

import {
    click,
    openSelectMenu,
    renderWithTestProviders as render,
    wrapWithTestProviders,
} from "../../../test/utils";
import { waitForRequest } from "../../../helpers/utils";
import {
    expectedCalculatorTab,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
    expectedOutputUnitLabel,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    clickByName,
    selectItemAndTarget,
    selectOutputUnit,
    expectedCreatorOverrideQueryName,
    expectedCalculatorOutputQueryName,
    expectedRequirementsHeading,
    expectedMachineToolCheckboxLabel,
    createRequirement,
    createRequirementCreator,
    expectedWorkerInputLabel,
    expectedTargetAmountInputLabel,
    expectedRequirementsUnhandledErrorText,
} from "./utils";
import {
    OutputUnit,
    Requirement,
} from "../../../graphql/__generated__/graphql";

import Calculator from "../Calculator";
import {
    createCalculatorOutputErrorHandler,
    createCalculatorOutputResponseHandler,
    createCalculatorOutputUserErrorHandler,
} from "./utils/handlers";
import Output from "../components/Output";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const item = createRequirement({
    name: "Required Item 1",
    amount: 30,
    creators: [
        createRequirementCreator({
            recipeName: "Required Item 1",
            amount: 30,
            workers: 20,
        }),
    ],
});

const server = setupServer(
    graphql.query(expectedItemNameQueryName, () => {
        return HttpResponse.json({
            data: {
                distinctItemNames: [{ id: item.id, name: item.name }],
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
    createCalculatorOutputResponseHandler([item]),
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

test.each(["Seconds", "Minutes", "Game days"])(
    "renders the %s option in the output unit selector",
    async (unit: string) => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await openSelectMenu({ label: expectedOutputUnitLabel });

        expect(
            await screen.findByRole("option", {
                name: unit,
            }),
        ).toBeVisible();
    },
);

test("selects the Minutes option by default", async () => {
    const expected = "Minutes";

    render(<Calculator />, expectedGraphQLAPIURL);
    await openSelectMenu({ label: expectedOutputUnitLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedOutputUnitLabel }),
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        }),
    ).toBeVisible();
});

test("updates the selected output unit if selected is changed", async () => {
    const expected = "Game days";

    render(<Calculator />);
    await selectOutputUnit(OutputUnit.GameDays);
    await openSelectMenu({ label: expectedOutputUnitLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedOutputUnitLabel }),
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        }),
    ).toBeVisible();
});

test("does not reset the currently selected output unit after changing tabs", async () => {
    const expected = "Game days";

    render(<Calculator />);
    await selectOutputUnit(OutputUnit.GameDays);
    await clickByName(expectedSettingsTab, "tab");
    await screen.findByRole("heading", {
        name: expectedSettingsTabHeader,
        level: 2,
    });
    await clickByName(expectedCalculatorTab, "tab");

    expect(
        await screen.findByRole("combobox", { name: expectedOutputUnitLabel }),
    ).toHaveTextContent(expected);
});

test("queries calculator output if item and workers inputted with default unit selected", async () => {
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectItemAndTarget({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await screen.findByRole("heading", { name: expectedRequirementsHeading });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        id: item.id,
        workers: expectedWorkers,
        amount: null,
        unit: OutputUnit.Minutes,
        maxAvailableTool: "NONE",
        hasMachineTools: false,
    });
});

test("queries calculator output if item and workers inputted with non-default unit selected", async () => {
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOutputUnit(OutputUnit.GameDays);
    await selectItemAndTarget({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await screen.findByRole("heading", { name: expectedRequirementsHeading });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        id: item.id,
        workers: expectedWorkers,
        amount: null,
        unit: OutputUnit.GameDays,
        maxAvailableTool: "NONE",
        hasMachineTools: false,
    });
});

test("queries calculator output if item and target amount inputted with default unit selected", async () => {
    const expectedAmount = 5.2;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOutputUnit(OutputUnit.GameDays);
    await selectItemAndTarget({
        itemName: item.name,
        amount: expectedAmount,
    });
    await screen.findByRole("heading", { name: expectedRequirementsHeading });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        id: item.id,
        workers: null,
        amount: expectedAmount,
        unit: OutputUnit.GameDays,
        maxAvailableTool: "NONE",
        hasMachineTools: false,
    });
});

test("queries calculator output if item and target amount inputted with non-default unit selected", async () => {
    const expectedAmount = 5.2;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName,
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectItemAndTarget({
        itemName: item.name,
        amount: expectedAmount,
    });
    await screen.findByRole("heading", { name: expectedRequirementsHeading });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        id: item.id,
        workers: null,
        amount: expectedAmount,
        unit: OutputUnit.Minutes,
        maxAvailableTool: "NONE",
        hasMachineTools: false,
    });
});

describe.each([
    [
        "unexpected",
        () => createCalculatorOutputErrorHandler("Unexpected"),
        expectedRequirementsUnhandledErrorText,
        "error message",
    ],
    [
        "requirements query user errors",
        () =>
            createCalculatorOutputUserErrorHandler({
                requirementsUserError: "Requirements user error",
            }),
        "Requirements user error",
        "the error message from requirements query",
    ],
])(
    "handles %s errors while fetching output",
    async (
        _: string,
        handler,
        expected: string,
        expectedErrorTestText: string,
    ) => {
        beforeEach(() => {
            server.use(handler());
        });

        test(`renders the ${expectedErrorTestText} if an error occurs while fetching optimal output`, async () => {
            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndTarget({
                itemName: item.name,
                workers: 5,
            });

            expect(await screen.findByRole("alert")).toHaveTextContent(
                expected,
            );
        });

        test("does not render the requirements section header", async () => {
            render(<Calculator />);
            await selectItemAndTarget({
                itemName: item.name,
                workers: 5,
            });
            await screen.findByRole("alert");

            expect(
                screen.queryByRole("heading", {
                    name: expectedRequirementsHeading,
                }),
            ).not.toBeInTheDocument();
        });

        test("does not render the requirements table", async () => {
            render(<Calculator />);
            await selectItemAndTarget({
                itemName: item.name,
                workers: 5,
            });
            await screen.findByRole("alert");

            expect(screen.queryByRole("table")).not.toBeInTheDocument();
        });
    },
);

test("queries optimal output and requirements with machine tool availability once checked", async () => {
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
            maxAvailableTool: "NONE",
            hasMachineTools: true,
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
    await screen.findByRole("heading", { name: expectedRequirementsHeading });

    await expect(expectedRequest).resolves.not.toThrow();
});

test.each([
    ["item with single creator", [item], 20],
    [
        "item with multiple creators",
        [
            createRequirement({
                name: item.name,
                amount: 50,
                creators: [
                    createRequirementCreator({
                        recipeName: item.name,
                        creator: "Creator 1",
                        amount: 45,
                        workers: 12,
                    }),
                    createRequirementCreator({
                        recipeName: item.name,
                        creator: "Creator 2",
                        amount: 5,
                        workers: 2,
                    }),
                ],
            }),
        ],
        14,
    ],
    [
        "item with single creator with floating point worker count",
        [
            createRequirement({
                name: item.name,
                amount: 50,
                creators: [
                    createRequirementCreator({
                        recipeName: item.name,
                        creator: "Creator 1",
                        amount: 45,
                        workers: 12.5,
                    }),
                ],
            }),
        ],
        13,
    ],
])(
    "sets output workers input to total output workers required if target amount entered given %s",
    async (_: string, requirements: Requirement[], expected: number) => {
        server.use(createCalculatorOutputResponseHandler(requirements));

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndTarget({
            itemName: item.name,
            amount: 10,
        });
        await screen.findByRole("heading", {
            name: expectedRequirementsHeading,
        });

        await waitFor(() =>
            expect(
                screen.getByLabelText(expectedWorkerInputLabel, {
                    selector: "input",
                }),
            ).toHaveValue(expected.toString()),
        );
    },
);

test("sets output target amount to total output amount if workers entered", async () => {
    render(<Calculator />, expectedGraphQLAPIURL);
    await selectItemAndTarget({
        itemName: item.name,
        workers: 10,
    });
    await screen.findByRole("heading", {
        name: expectedRequirementsHeading,
    });

    await waitFor(() =>
        expect(
            screen.getByLabelText(expectedTargetAmountInputLabel, {
                selector: "input",
            }),
        ).toHaveValue(item.amount.toString()),
    );
});

describe("debounces output requests", () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    test("only requests optimal output every 500ms on worker change", async () => {
        const expectedItemID = "testitem";
        const expectedOutputUnit = OutputUnit.GameDays;
        const expectedLastRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedCalculatorOutputQueryName,
            {
                id: expectedItemID,
                amount: null,
                workers: 3,
                unit: expectedOutputUnit,
            },
        );

        const { rerender } = rtlRender(
            wrapWithTestProviders(
                <Output
                    itemID={expectedItemID}
                    target={{ workers: 1 }}
                    outputUnit={expectedOutputUnit}
                    onSelectedItemTotalChange={() => {
                        return;
                    }}
                />,
                expectedGraphQLAPIURL,
            ),
        );
        rerender(
            wrapWithTestProviders(
                <Output
                    itemID={expectedItemID}
                    target={{ workers: 2 }}
                    outputUnit={expectedOutputUnit}
                    onSelectedItemTotalChange={() => {
                        return;
                    }}
                />,
                expectedGraphQLAPIURL,
            ),
        );
        rerender(
            wrapWithTestProviders(
                <Output
                    itemID={expectedItemID}
                    target={{ workers: 3 }}
                    outputUnit={expectedOutputUnit}
                    onSelectedItemTotalChange={() => {
                        return;
                    }}
                />,
                expectedGraphQLAPIURL,
            ),
        );
        act(() => {
            vi.advanceTimersByTime(500);
        });
        const { detailsUpToMatch } = await expectedLastRequest;

        expect(detailsUpToMatch).not.toContainEqual(
            expect.objectContaining({ workers: 2 }),
        );
    });

    test("only requests optimal output every 500ms on target amount change", async () => {
        const expectedItemID = "testitem";
        const expectedOutputUnit = OutputUnit.GameDays;
        const expectedLastRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedCalculatorOutputQueryName,
            {
                id: expectedItemID,
                amount: 3,
                workers: null,
                unit: expectedOutputUnit,
            },
        );

        const { rerender } = rtlRender(
            wrapWithTestProviders(
                <Output
                    itemID={expectedItemID}
                    target={{ amount: 1 }}
                    outputUnit={expectedOutputUnit}
                    onSelectedItemTotalChange={() => {
                        return;
                    }}
                />,
                expectedGraphQLAPIURL,
            ),
        );
        rerender(
            wrapWithTestProviders(
                <Output
                    itemID={expectedItemID}
                    target={{ amount: 2 }}
                    outputUnit={expectedOutputUnit}
                    onSelectedItemTotalChange={() => {
                        return;
                    }}
                />,
                expectedGraphQLAPIURL,
            ),
        );
        rerender(
            wrapWithTestProviders(
                <Output
                    itemID={expectedItemID}
                    target={{ amount: 3 }}
                    outputUnit={expectedOutputUnit}
                    onSelectedItemTotalChange={() => {
                        return;
                    }}
                />,
                expectedGraphQLAPIURL,
            ),
        );
        act(() => {
            vi.advanceTimersByTime(500);
        });
        const { detailsUpToMatch } = await expectedLastRequest;

        expect(detailsUpToMatch).not.toContainEqual(
            expect.objectContaining({ amount: 2 }),
        );
    });

    afterAll(() => {
        vi.useRealTimers();
    });
});

afterAll(() => {
    server.close();
});
