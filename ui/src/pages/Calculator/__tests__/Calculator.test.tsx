import React from "react";
import { screen } from "@testing-library/react";
import { graphql } from "msw";
import { setupServer } from "msw/node";

import Calculator from "../Calculator";
import { renderWithTestProviders as render } from "../../../test/utils";
import {
    expectedRequirementsQueryName,
    expectedOutputQueryName,
    expectedItemNameQueryName,
    selectItemAndWorkers,
    expectedItemSelectLabel,
    expectedWorkerInputLabel,
    expectedOutputPrefix,
    expectedFarmSizeNotePrefix,
    ItemName,
} from "./utils";
import { expectedItemDetailsQueryName } from "./utils";

const itemWithoutFarmSize: ItemName = { name: "item w/o farm" };
const itemWithFarmSize: ItemName = { name: "item with farm" };
const expectedFarmSizeDetails = {
    size: { width: 20, height: 4 },
};
const items = [itemWithFarmSize, itemWithoutFarmSize];

const server = setupServer(
    graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
        return res(ctx.data({ item: items }));
    }),
    graphql.query(expectedItemDetailsQueryName, (req, res, ctx) => {
        const { name } = req.variables;
        if (name === itemWithFarmSize.name) {
            return res(ctx.data({ item: [expectedFarmSizeDetails] }));
        }

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

describe("worker input rendering", () => {
    const expectedErrorMessage =
        "Invalid input, must be a positive non-zero whole number";

    test("renders an input to enter the number of workers", async () => {
        render(<Calculator />);

        expect(
            await screen.findByLabelText(expectedWorkerInputLabel, {
                selector: "input",
            })
        ).toBeVisible();
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
                    itemName: items[0].name,
                    workers: input,
                });

                expect(await screen.findByRole("alert")).toHaveTextContent(
                    expectedErrorMessage
                );
            });

            test("does not render optimal output message", async () => {
                render(<Calculator />);
                await selectItemAndWorkers({
                    itemName: items[0].name,
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
            itemName: items[0].name,
            workers: invalidInput,
        });
        await screen.findByRole("alert");
        await selectItemAndWorkers({ workers: validInput, clear: true });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});

describe("optimal farm size note rendering", () => {
    test("renders the optimal height and width of the farm if provided", async () => {
        const expectedMessage = `${expectedFarmSizeNotePrefix} ${expectedFarmSizeDetails.size.width} x ${expectedFarmSizeDetails.size.height}`;

        render(<Calculator />);
        await selectItemAndWorkers({ itemName: itemWithFarmSize.name });

        expect(await screen.findByText(expectedMessage)).toBeVisible();
    });

    test("does not render optimal farm size message if no size provided", async () => {
        render(<Calculator />);
        await selectItemAndWorkers({ itemName: itemWithoutFarmSize.name });
        await screen.findByRole("combobox", { name: expectedItemSelectLabel });

        expect(
            screen.queryByText(expectedFarmSizeNotePrefix, { exact: false })
        ).not.toBeInTheDocument();
    });

    test("does not render optimal farm size message if item details could not fetched", async () => {
        server.use(
            graphql.query(expectedItemDetailsQueryName, (_, res, ctx) => {
                return res.once(ctx.errors([{ message: "Error Message" }]));
            })
        );

        render(<Calculator />);
        await screen.findByRole("alert");

        expect(
            screen.queryByText(expectedFarmSizeNotePrefix, { exact: false })
        ).not.toBeInTheDocument();
    });
});

afterAll(() => {
    server.close();
});
