import React from "react";
import { screen } from "@testing-library/react";
import { graphql } from "msw";
import { setupServer } from "msw/node";

import { waitForRequest } from "../../../helpers/utils";
import Calculator from "../Calculator";
import { renderWithTestProviders as render } from "../../../test/utils";
import {
    expectedRequirementsQueryName,
    expectedOutputQueryName,
    expectedItemNameQueryName,
    selectItemAndWorkers,
    expectedOutputUnitLabel,
    expectedItemSelectLabel,
    expectedWorkerInputLabel,
    expectedOutputPrefix,
    expectedFarmSizeNotePrefix,
} from "./utils";
import { expectedItemDetailsQueryName } from "./utils";
import { Item } from "../../../graphql/__generated__/graphql";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedMissingItemsError = "Unable to fetch known items";
const expectedNetworkExceptionError =
    "An error occurred fetching item details, please refresh the page and try again.";

type ItemName = Pick<Item, "name">;

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
    server.use(
        graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
            return res(ctx.data({ item: items }));
        })
    );
});

describe("output selector", () => {
    test("queries all known item names", async () => {
        const expectedRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedItemNameQueryName
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        const [, body] = await expectedRequest;

        expect(body?.variables).toEqual({});
    });

    test("renders desired output header", async () => {
        const expectedHeader = "Desired output:";

        render(<Calculator />);

        expect(
            await screen.findByRole("heading", { name: expectedHeader })
        ).toBeVisible();
    });

    describe("given no item names returned", () => {
        beforeEach(() => {
            server.use(
                graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
                    return res(ctx.data({ item: [] }));
                })
            );
        });

        test("renders a missing items error", async () => {
            render(<Calculator />);

            expect(await screen.findByRole("alert")).toHaveTextContent(
                expectedMissingItemsError
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

    test("does not render a missing known items if item names are returned", async () => {
        render(<Calculator />);
        await screen.findByRole("combobox", { name: expectedItemSelectLabel });

        expect(
            screen.queryByText(expectedMissingItemsError)
        ).not.toBeInTheDocument();
    });

    test("renders a select for the desired output selector if item names are returned", async () => {
        render(<Calculator />);

        expect(
            await screen.findByRole("combobox", {
                name: expectedItemSelectLabel,
            })
        ).toBeVisible();
    });

    test("renders each item name returned as an option in the combo box", async () => {
        render(<Calculator />);
        await screen.findByRole("combobox", { name: expectedItemSelectLabel });

        for (const expected of items) {
            expect(
                screen.getByRole("option", { name: expected.name })
            ).toBeInTheDocument();
        }
    });

    test("renders the first option in the item name list as selected by default", async () => {
        render(<Calculator />);

        expect(
            await screen.findByRole("option", {
                name: items[0].name,
                selected: true,
            })
        ).toBeInTheDocument();
    });

    test("requests item details on the first option in the item name list without selection", async () => {
        const expectedRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedItemDetailsQueryName
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await screen.findByRole("combobox", { name: expectedItemSelectLabel });
        const [, body] = await expectedRequest;

        expect(body?.variables).toEqual({ name: items[0].name });
    });

    test("requests item details for newly selected item if selection is changed", async () => {
        const expectedItemName = items[1].name;
        const expectedRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedItemDetailsQueryName,
            { name: expectedItemName }
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await screen.findByRole("combobox", { name: expectedItemSelectLabel });

        await selectItemAndWorkers({ itemName: expectedItemName });

        const [, body] = await expectedRequest;

        expect(body?.variables).toEqual({ name: expectedItemName });
    });

    describe("item name request error handling", () => {
        beforeEach(() => {
            server.use(
                graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
                    return res.once(ctx.errors([{ message: "Error Message" }]));
                })
            );
        });

        test("renders an unhandled error message", async () => {
            render(<Calculator />);

            expect(await screen.findByRole("alert")).toHaveTextContent(
                expectedNetworkExceptionError
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

    test("renders an unhandled error message if an exception occurs fetching item details", async () => {
        server.use(
            graphql.query(expectedItemDetailsQueryName, (_, res, ctx) => {
                return res.once(ctx.errors([{ message: "Error Message" }]));
            })
        );

        render(<Calculator />);

        expect(await screen.findByRole("alert")).toHaveTextContent(
            expectedNetworkExceptionError
        );
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
