import React from "react";
import { HttpResponse, delay, graphql } from "msw";
import { setupServer } from "msw/node";
import { act, screen, render as rtlRender } from "@testing-library/react";
import { vi } from "vitest";

import {
    click,
    openSelectMenu,
    renderWithTestProviders as render,
    wrapWithTestProviders,
} from "../../../test/utils";
import { waitForRequest } from "../../../helpers/utils";
import {
    ItemName,
    expectedCalculatorTab,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
    expectedOutputPrefix,
    expectedOutputUnitLabel,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    clickByName,
    selectItemAndWorkers,
    selectOutputUnit,
    expectedCreatorOverrideQueryName,
    expectedCalculatorOutputQueryName,
    expectedLoadingOutputMessage,
    expectedRequirementsHeading,
    expectedMachineToolCheckboxLabel,
} from "./utils";
import { OutputUnit } from "../../../graphql/__generated__/graphql";

import Calculator from "../Calculator";
import {
    createCalculatorOutputErrorHandler,
    createCalculatorOutputResponseHandler,
    createCalculatorOutputUserErrorHandler,
} from "./utils/handlers";
import Output from "../components/Output";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const item: ItemName = { name: "Item 1" };
const expectedOutputMessage = `${expectedOutputPrefix} 5.2 per minute`;

const server = setupServer(
    graphql.query(expectedItemNameQueryName, () => {
        return HttpResponse.json({
            data: {
                distinctItemNames: [item.name],
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
    createCalculatorOutputResponseHandler([], 5.2),
    graphql.query(expectedCreatorOverrideQueryName, () => {
        return HttpResponse.json({ data: { item: [] } });
    })
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
            })
        ).toBeVisible();
    }
);

test("selects the Minutes option by default", async () => {
    const expected = "Minutes";

    render(<Calculator />, expectedGraphQLAPIURL);
    await openSelectMenu({ label: expectedOutputUnitLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedOutputUnitLabel })
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        })
    ).toBeVisible();
});

test("updates the selected output unit if selected is changed", async () => {
    const expected = "Game days";

    render(<Calculator />);
    await selectOutputUnit(OutputUnit.GameDays);
    await openSelectMenu({ label: expectedOutputUnitLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedOutputUnitLabel })
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        })
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
        await screen.findByRole("combobox", { name: expectedOutputUnitLabel })
    ).toHaveTextContent(expected);
});

test("queries calculator output if item and workers inputted with default unit selected", async () => {
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCalculatorOutputQueryName
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await screen.findByText(expectedOutputMessage);
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        name: item.name,
        workers: expectedWorkers,
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
        expectedCalculatorOutputQueryName
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOutputUnit(OutputUnit.GameDays);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await screen.findByText(`${expectedOutputPrefix} 5.2 per game day`);
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        name: item.name,
        workers: expectedWorkers,
        unit: OutputUnit.GameDays,
        maxAvailableTool: "NONE",
        hasMachineTools: false,
    });
});

test("renders the clear input button if workers inputted", async () => {
    const expectedClearLabel = "Clear worker input";

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectItemAndWorkers({ workers: 5 });

    expect(
        await screen.findByRole("button", { name: expectedClearLabel })
    ).toBeVisible();
});

test("does not render the optimal output message if output has not been received yet", async () => {
    server.use(
        graphql.query(expectedCalculatorOutputQueryName, async () => {
            await delay("infinite");
            return HttpResponse.json({});
        })
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOutputUnit(OutputUnit.GameDays);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: 5,
    });

    expect(await screen.findByText(expectedLoadingOutputMessage)).toBeVisible();
    expect(
        screen.queryByText(expectedOutputPrefix, { exact: false })
    ).not.toBeInTheDocument();
});

test.each([
    ["seconds", OutputUnit.Seconds, 0.1, "second"],
    ["minutes", OutputUnit.Minutes, 5, "minute"],
    ["game days", OutputUnit.GameDays, 60, "game day"],
])(
    "renders the optimal output in %s if selected",
    async (
        _: string,
        selectedUnit: OutputUnit,
        expected: number,
        expectedUnit: string
    ) => {
        const expectedOutput = `${expectedOutputPrefix} ${expected} per ${expectedUnit}`;
        server.use(createCalculatorOutputResponseHandler([], expected));

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectOutputUnit(selectedUnit);
        await selectItemAndWorkers({
            itemName: item.name,
            workers: 5,
        });

        expect(await screen.findByText(expectedOutput)).toBeVisible();
    }
);

test.each([
    [
        "rounds optimal output to 1 decimals if more than 1 decimal places",
        28.23,
        "≈28.2",
    ],
    [
        "does not show approx symbol if optimal output is only accurate to 1 decimal place",
        28.1,
        "28.1",
    ],
    [
        "rounds optimal output to more precision if rounding would output zero",
        0.0012,
        "≈0.001",
    ],
    [
        "does not show approx symbol if optimal output has no additional precision (below 0.1)",
        0.001,
        "0.001",
    ],
    [
        "rounds optimal output to 1 decimal place (recurring close to ceil)",
        0.8999999999999999,
        "≈0.9",
    ],
])("%s", async (_: string, actual: number, expected: string) => {
    const expectedOutput = `${expectedOutputPrefix} ${expected} per minute`;
    server.use(createCalculatorOutputResponseHandler([], actual));

    render(<Calculator />);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: 5,
    });

    expect(await screen.findByText(expectedOutput)).toBeVisible();
});

test("clears the optimal output message if the workers is changed to an invalid value", async () => {
    const output = 28.1;
    const expectedOutput = `${expectedOutputPrefix} ${output} per minute`;
    server.use(createCalculatorOutputResponseHandler([], output));

    render(<Calculator />);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: 5,
    });
    await screen.findByText(expectedOutput);
    await selectItemAndWorkers({ workers: "wibble", clear: true });

    expect(
        screen.queryByText(expectedOutputPrefix, { exact: false })
    ).not.toBeInTheDocument();
});

describe.each([
    [
        "unexpected",
        () => createCalculatorOutputErrorHandler("Unexpected"),
        "An error occurred while calculating output, please change item/workers/output unit and try again.",
        "error message",
    ],
    [
        "combined consistent user",
        () =>
            createCalculatorOutputUserErrorHandler({
                requirementsUserError: "Consistent user error",
                amountUserError: "Consistent user error",
            }),
        "Consistent user error",
        "one error message",
    ],
    [
        "inconsistent user error",
        () =>
            createCalculatorOutputUserErrorHandler({
                requirementsUserError: "Requirements user error",
                amountUserError: "Amount user error",
            }),
        "Requirements user error",
        "the error message from requirements query",
    ],
    [
        "only amount query user errors",
        () =>
            createCalculatorOutputUserErrorHandler({
                requirements: [],
                amountUserError: "Amount user error",
            }),
        "Amount user error",
        "the error message from amount query",
    ],
    [
        "only requirements query user errors",
        () =>
            createCalculatorOutputUserErrorHandler({
                requirementsUserError: "Requirements user error",
                amount: 5.2,
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
        expectedErrorTestText: string
    ) => {
        beforeEach(() => {
            server.use(handler());
        });

        test(`renders the ${expectedErrorTestText} if an error occurs while fetching optimal output`, async () => {
            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: item.name,
                workers: 5,
            });

            expect(await screen.findByRole("alert")).toHaveTextContent(
                expected
            );
        });

        test("does not render the optimal output message", async () => {
            render(<Calculator />);
            await selectItemAndWorkers({
                itemName: item.name,
                workers: 5,
            });
            await screen.findByRole("alert");

            expect(
                screen.queryByText(expectedOutputPrefix, { exact: false })
            ).not.toBeInTheDocument();
        });

        test("does not render the requirements section header", async () => {
            render(<Calculator />);
            await selectItemAndWorkers({
                itemName: item.name,
                workers: 5,
            });
            await screen.findByRole("alert");

            expect(
                screen.queryByRole("heading", {
                    name: expectedRequirementsHeading,
                })
            ).not.toBeInTheDocument();
        });

        test("does not render the requirements table", async () => {
            render(<Calculator />);
            await selectItemAndWorkers({
                itemName: item.name,
                workers: 5,
            });
            await screen.findByRole("alert");

            expect(screen.queryByRole("table")).not.toBeInTheDocument();
        });
    }
);

test("queries optimal output and requirements with machine tool availability once checked", async () => {
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
            maxAvailableTool: "NONE",
            hasMachineTools: true,
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    await click({
        label: expectedMachineToolCheckboxLabel,
        role: "checkbox",
    });
    await screen.findByText(expectedOutputMessage);

    await expect(expectedRequest).resolves.not.toThrow();
});

describe("debounces output requests", () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    test("only requests optimal output every 500ms on worker change", async () => {
        const expectedItemName = "test item";
        const expectedOutputUnit = OutputUnit.GameDays;
        const expectedLastRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedCalculatorOutputQueryName,
            { name: expectedItemName, workers: 3, unit: expectedOutputUnit }
        );

        const { rerender } = rtlRender(
            wrapWithTestProviders(
                <Output
                    itemName={expectedItemName}
                    workers={1}
                    outputUnit={expectedOutputUnit}
                />,
                expectedGraphQLAPIURL
            )
        );
        rerender(
            wrapWithTestProviders(
                <Output
                    itemName={expectedItemName}
                    workers={2}
                    outputUnit={expectedOutputUnit}
                />,
                expectedGraphQLAPIURL
            )
        );
        rerender(
            wrapWithTestProviders(
                <Output
                    itemName={expectedItemName}
                    workers={3}
                    outputUnit={expectedOutputUnit}
                />,
                expectedGraphQLAPIURL
            )
        );
        act(() => {
            vi.advanceTimersByTime(500);
        });
        const { detailsUpToMatch } = await expectedLastRequest;

        expect(detailsUpToMatch).not.toContainEqual(
            expect.objectContaining({ workers: 2 })
        );
    });

    afterAll(() => {
        vi.useRealTimers();
    });
});

afterAll(() => {
    server.close();
});
