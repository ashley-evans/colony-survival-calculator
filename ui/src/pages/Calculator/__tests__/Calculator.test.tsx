import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { graphql, rest } from "msw";
import { setupServer } from "msw/node";

import { waitForRequest } from "../../../helpers/utils";
import Calculator from "../Calculator";
import { Item, Items } from "../../../types";
import { STATIC_ITEMS_PATH } from "../../../utils";
import { renderWithTestProviders as render } from "../../../test/utils";
import {
    selectItemAndWorkers,
    expectedRequirementsQueryName,
    expectedOutputUnitLabel,
    expectedItemSelectLabel,
    expectedWorkerInputLabel,
    expectedOutputPrefix,
    expectedOutputQueryName,
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

afterAll(() => {
    server.close();
});
