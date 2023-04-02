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
    ItemName,
    expectedDesiredOutputHeader,
} from "./utils";
import { expectedItemDetailsQueryName } from "./utils";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedMissingItemsError = "Unable to fetch known items";
const expectedNetworkExceptionError =
    "An error occurred fetching item details, please refresh the page and try again.";

const items: ItemName[] = [{ name: "Item 1" }, { name: "Item 2" }];

const server = setupServer(
    graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
        return res(ctx.data({ item: items }));
    }),
    graphql.query(expectedItemDetailsQueryName, (_, res, ctx) => {
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
    render(<Calculator />);

    expect(
        await screen.findByRole("heading", {
            name: expectedDesiredOutputHeader,
        })
    ).toBeVisible();
});

describe("handles item loading", () => {
    const expectedMessage = "Loading items...";

    beforeEach(() => {
        server.use(
            graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
                return res(ctx.delay("infinite"));
            })
        );
    });

    test("renders a loading message...", async () => {
        render(<Calculator />);

        expect(await screen.findByText(expectedMessage)).toBeVisible();
    });

    test("does not render the desired output header", async () => {
        render(<Calculator />);
        await screen.findByText(expectedMessage);

        expect(
            screen.queryByRole("heading", {
                name: expectedDesiredOutputHeader,
            })
        ).not.toBeInTheDocument();
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
