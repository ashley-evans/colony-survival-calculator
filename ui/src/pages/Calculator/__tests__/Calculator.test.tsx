import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { graphql, rest } from "msw";
import { setupServer } from "msw/node";

import { waitForRequest } from "../../../helpers/utils";
import Calculator from "../Calculator";
import { Item, Items } from "../../../types";
import { Units, STATIC_ITEMS_PATH } from "../../../utils";
import { renderWithTestProviders as render } from "../../../test/utils";
import {
    selectItemAndWorkers,
    selectOutputUnit,
    expectedRequirementsQueryName,
    expectedOutputUnitLabel,
    expectedItemSelectLabel,
    expectedWorkerInputLabel,
    expectedOutputPrefix,
} from "./utils";

const VALID_FARM_ABLES: Required<Item>[] = [
    {
        name: "Test Farmable 1",
        createTime: 5,
        output: 10,
        requires: [],
        size: { width: 10, height: 10 },
    },
];

const CRAFT_ABLE_ITEMS: Items = [
    { name: "Test Item 1", createTime: 2, output: 1, requires: [] },
    { name: "Test Item 2", createTime: 4, output: 2, requires: [] },
    { name: "Test Item 7", createTime: 8.5, output: 1, requires: [] },
];

const CRAFT_ABLE_ITEMS_REQS: Items = [
    {
        name: "Test Item 3",
        createTime: 8,
        output: 1,
        requires: [{ name: "Test Item 1", amount: 5 }],
    },
    {
        name: "Test Item 4",
        createTime: 16,
        output: 1,
        requires: [{ name: "Test Item 2", amount: 3 }],
    },
    {
        name: "Test Item 6",
        createTime: 30,
        output: 4,
        requires: [
            { name: "Test Item 1", amount: 9 },
            { name: "Test Item 2", amount: 3 },
        ],
    },
];

const CRAFT_ABLE_ITEMS_MISSING_REQS: Items = [
    {
        name: "Test Item 5",
        createTime: 8,
        output: 1,
        requires: [{ name: "Invalid Test Item", amount: 5 }],
    },
];

const VALID_ITEMS: Items = [
    ...CRAFT_ABLE_ITEMS,
    ...VALID_FARM_ABLES,
    ...CRAFT_ABLE_ITEMS_REQS,
    ...CRAFT_ABLE_ITEMS_MISSING_REQS,
];

const server = setupServer(
    rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
        return res(ctx.json(VALID_ITEMS));
    }),
    graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
        return res(ctx.data({ requirement: [] }));
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
});

describe("output selector", () => {
    test("fetches all known static items", async () => {
        const expectedRequest = waitForRequest(
            server,
            "GET",
            STATIC_ITEMS_PATH
        );

        render(<Calculator />);

        await expect(expectedRequest).resolves.not.toThrowError();
    });

    test("renders desired output header", async () => {
        const expectedHeader = "Desired output:";

        render(<Calculator />);

        expect(
            await screen.findByRole("heading", { name: expectedHeader })
        ).toBeVisible();
    });

    describe.each([
        ["no static items returned", []],
        ["invalid static items returned", [{ invalid: "invalid" }]],
    ])("given %s", (_: string, items) => {
        beforeEach(() => {
            server.use(
                rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
                    return res(ctx.json(items));
                })
            );
        });

        test("renders a missing items error", async () => {
            const expectedError = "Error: Unable to fetch known items";

            render(<Calculator />);

            expect(await screen.findByRole("alert")).toHaveTextContent(
                expectedError
            );
        });

        test("does not render a combo box for the desired output", () => {
            render(<Calculator />);

            expect(
                screen.queryByRole("combobox", {
                    name: expectedItemSelectLabel,
                })
            ).not.toBeInTheDocument();
        });

        test("does not render a worker input box", () => {
            render(<Calculator />);

            expect(
                screen.queryByLabelText(expectedWorkerInputLabel, {
                    selector: "input",
                })
            ).not.toBeInTheDocument();
        });

        test("does not render a combo box for the desired output units", () => {
            render(<Calculator />);

            expect(
                screen.queryByRole("combobox", {
                    name: expectedOutputUnitLabel,
                })
            ).not.toBeInTheDocument();
        });
    });

    test("does not render a missing known items if static items are returned", async () => {
        const expectedRequest = waitForRequest(
            server,
            "GET",
            STATIC_ITEMS_PATH
        );
        const errorMessage = "Error: Unable to fetch known items";

        render(<Calculator />);
        await waitFor(() => expectedRequest);

        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    test("renders a select for the desired output selector if static items exist", async () => {
        const expectedLabel = "Item:";

        render(<Calculator />);

        expect(
            await screen.findByRole("combobox", { name: expectedLabel })
        ).toBeVisible();
    });

    test("renders each item returned as an option in the combo box", async () => {
        render(<Calculator />);
        await screen.findByRole("combobox", { name: expectedItemSelectLabel });

        for (const expected of VALID_ITEMS) {
            expect(
                screen.getByRole("option", { name: expected.name })
            ).toBeInTheDocument();
        }
    });

    test("renders the first option in the items list as selected by default", async () => {
        render(<Calculator />);

        expect(
            await screen.findByRole("option", {
                name: VALID_ITEMS[0].name,
                selected: true,
            })
        ).toBeInTheDocument();
    });
});

describe("worker input rendering", () => {
    const expectedErrorMessage =
        "Invalid input, must be a positive non-zero whole number";

    test("renders an input to enter the number of workers", async () => {
        render(<Calculator />);

        expect(
            await screen.findByLabelText(expectedWorkerInputLabel, {
                selector: "input",
            })
        );
    });

    test("does not render an error message by default", async () => {
        render(<Calculator />);
        await screen.findByLabelText(expectedWorkerInputLabel, {
            selector: "input",
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    describe.each([
        ["negative", "-1"],
        ["zero", "0"],
        ["float", "1.1"],
        ["not a number", "test"],
        ["number with invalid character suffix", "3-test"],
    ])(
        "renders invalid workers message if workers is %s",
        (_: string, input: string) => {
            test("renders invalid workers message", async () => {
                render(<Calculator />);
                await selectItemAndWorkers({
                    itemName: CRAFT_ABLE_ITEMS[0].name,
                    workers: input,
                });

                expect(await screen.findByRole("alert")).toHaveTextContent(
                    expectedErrorMessage
                );
            });

            test("does not render optimal output message", async () => {
                render(<Calculator />);
                await selectItemAndWorkers({
                    itemName: CRAFT_ABLE_ITEMS[0].name,
                    workers: input,
                });

                expect(
                    screen.queryByText(expectedOutputPrefix, { exact: false })
                ).not.toBeInTheDocument();
            });
        }
    );

    test("clears error message after changing input to a valid input", async () => {
        const invalidInput = "Invalid";
        const validInput = "1";

        render(<Calculator />);
        await selectItemAndWorkers({
            itemName: CRAFT_ABLE_ITEMS[0].name,
            workers: invalidInput,
        });
        await screen.findByRole("alert");
        await selectItemAndWorkers({ workers: validInput, clear: true });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});

describe("optimal output rendering", () => {
    test("does not render any output message by default", async () => {
        render(<Calculator />);
        await screen.findByLabelText(expectedWorkerInputLabel, {
            selector: "input",
        });

        expect(
            screen.queryByText(expectedOutputPrefix, { exact: false })
        ).not.toBeInTheDocument();
    });

    test("renders the optimal output given valid workers and default item selected", async () => {
        const expectedOutput = `${expectedOutputPrefix} 90 per minute`;

        render(<Calculator />);
        await selectItemAndWorkers({ workers: 3 });

        expect(await screen.findByText(expectedOutput)).toBeVisible();
    });

    test("renders the optimal output given multiple workers and non-default item selected", async () => {
        const input = "5";
        const expectedOutput = `${expectedOutputPrefix} 150 per minute`;

        render(<Calculator />);
        await selectItemAndWorkers({
            itemName: VALID_ITEMS[1].name,
            workers: input,
        });

        expect(await screen.findByText(expectedOutput)).toBeVisible();
    });

    test("clears output if workers is changed to invalid number", async () => {
        const validInput = "3";
        const invalidInput = "-1";
        const expectedOutput = `${expectedOutputPrefix} 90 per minute`;

        render(<Calculator />);
        await selectItemAndWorkers({ workers: validInput });
        await screen.findByText(expectedOutput);
        await selectItemAndWorkers({ workers: invalidInput, clear: true });

        expect(
            screen.queryByText(expectedOutputPrefix, { exact: false })
        ).not.toBeInTheDocument();
    });

    test("factors multiple output per create into optimal output", async () => {
        const workers = "3";
        const farmable = VALID_FARM_ABLES[0];
        const expectedOutput = `${expectedOutputPrefix} 360 per minute`;

        render(<Calculator />);
        await selectItemAndWorkers({ itemName: farmable.name, workers });

        expect(await screen.findByText(expectedOutput)).toBeVisible();
    });

    test("rounds optimal output to 1 decimals if more than 1 decimal places", async () => {
        const input = "4";
        const expectedOutput = `${expectedOutputPrefix} ≈28.2 per minute`;

        render(<Calculator />);
        await selectItemAndWorkers({
            itemName: CRAFT_ABLE_ITEMS[2].name,
            workers: input,
        });

        expect(await screen.findByText(expectedOutput)).toBeVisible();
    });
});

describe("optimal farm size note rendering", () => {
    const expectedNotePrefix = "Calculations use optimal farm size:";

    test("renders the optimal height and width of the farm if provided", async () => {
        const farmable = VALID_FARM_ABLES[0];
        const expectedMessage = `${expectedNotePrefix} ${farmable.size.width} x ${farmable.size.height}`;

        render(<Calculator />);
        await selectItemAndWorkers({ itemName: farmable.name });

        expect(await screen.findByText(expectedMessage)).toBeVisible();
    });

    test("does not render optimal farm size message if no size provided", async () => {
        const craft_able = CRAFT_ABLE_ITEMS[1];

        render(<Calculator />);
        await selectItemAndWorkers({ itemName: craft_able.name });
        await screen.findByRole("combobox", { name: expectedItemSelectLabel });

        expect(
            screen.queryByText(expectedNotePrefix, { exact: false })
        ).not.toBeInTheDocument();
    });
});

describe("output unit selection", () => {
    test("renders an output unit selector if static items exist", async () => {
        render(<Calculator />);

        expect(
            await screen.findByRole("combobox", {
                name: expectedOutputUnitLabel,
            })
        ).toBeVisible();
    });

    test("renders each valid output unit inside the unit selector", async () => {
        render(<Calculator />);
        await screen.findByRole("combobox", { name: expectedOutputUnitLabel });

        for (const expected of Object.values(Units)) {
            expect(
                screen.getByRole("option", { name: expected })
            ).toBeInTheDocument();
        }
    });

    test("renders the minutes option in the unit selector as selected by default", async () => {
        render(<Calculator />);

        expect(
            await screen.findByRole("option", {
                name: Units.MINUTES,
                selected: true,
            })
        ).toBeInTheDocument();
    });

    test.each([
        ["one item per craft", VALID_ITEMS[1].name, 720],
        ["multiple items per craft", VALID_FARM_ABLES[0].name, 2880],
    ])(
        "changing the unit to game days updates optimal output for items that create %s",
        async (_: string, itemName: string, expected: number) => {
            const workers = "2";
            const expectedOutput = `${expectedOutputPrefix} ${expected} per game day`;

            render(<Calculator />);
            await selectItemAndWorkers({ itemName, workers });
            await selectOutputUnit(Units.GAME_DAYS);

            expect(await screen.findByText(expectedOutput)).toBeVisible();
        }
    );
});

afterAll(() => {
    server.close();
});
