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
    expectedOutputUnitLabel,
    expectedItemSelectLabel,
    expectedWorkerInputLabel,
    ItemName,
    expectedCalculatorTabHeader,
    expectedToolSelectLabel,
    openSelectMenu,
    selectOption,
    openTab,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    expectedCalculatorTab,
} from "./utils";
import { expectedItemDetailsQueryName } from "./utils";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedMissingItemsError = "Unable to fetch known items";
const expectedNetworkExceptionError =
    "An error occurred fetching item details, please refresh the page and try again.";

const items: ItemName[] = [{ name: "Item 1" }, { name: "Item 2" }];

const server = setupServer(
    graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
        return res(
            ctx.data({ distinctItemNames: items.map((item) => item.name) })
        );
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
            return res(
                ctx.data({ distinctItemNames: items.map((item) => item.name) })
            );
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
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({});
});

test("renders desired output header", async () => {
    render(<Calculator />);

    expect(
        await screen.findByRole("heading", {
            name: expectedCalculatorTabHeader,
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

    test("renders a loading message", async () => {
        render(<Calculator />);

        expect(await screen.findByText(expectedMessage)).toBeVisible();
    });

    test("does not render the desired output header", async () => {
        render(<Calculator />);
        await screen.findByText(expectedMessage);

        expect(
            screen.queryByRole("heading", {
                name: expectedCalculatorTabHeader,
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
                return res(ctx.data({ distinctItemNames: [] }));
            })
        );
    });

    test("renders a missing items error", async () => {
        render(<Calculator />);

        expect(await screen.findByRole("alert")).toHaveTextContent(
            expectedMissingItemsError
        );
    });

    test("does not render a combo box for the desired output", async () => {
        render(<Calculator />);
        await screen.findByRole("alert");

        expect(
            screen.queryByRole("combobox", {
                name: expectedItemSelectLabel,
            })
        ).not.toBeInTheDocument();
    });

    test("does not render a worker input box", async () => {
        render(<Calculator />);
        await screen.findByRole("alert");

        expect(
            screen.queryByLabelText(expectedWorkerInputLabel, {
                selector: "input",
            })
        ).not.toBeInTheDocument();
    });

    test("does not render a select for tools", async () => {
        render(<Calculator />);
        await screen.findByRole("alert");

        expect(
            screen.queryByRole("combobox", {
                name: expectedToolSelectLabel,
            })
        ).not.toBeInTheDocument();
    });

    test("does not render a combo box for the desired output units", async () => {
        render(<Calculator />);
        await screen.findByRole("alert");

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
    await openSelectMenu({ selectLabel: expectedItemSelectLabel });

    for (const expected of items) {
        expect(
            screen.getByRole("option", { name: expected.name })
        ).toBeVisible();
    }
});

test("renders the first option in the item name list as selected by default", async () => {
    const expected = items[0].name;

    render(<Calculator />);
    await openSelectMenu({ selectLabel: expectedItemSelectLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedItemSelectLabel })
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        })
    ).toBeVisible();
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
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        filters: { name: items[0].name, optimal: { maxAvailableTool: "NONE" } },
    });
});

test("updates the selected option if selected is changed", async () => {
    const expected = items[1].name;

    render(<Calculator />);
    await selectOption({
        selectLabel: expectedItemSelectLabel,
        optionName: expected,
    });
    await openSelectMenu({ selectLabel: expectedItemSelectLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedItemSelectLabel })
    ).toHaveTextContent(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        })
    ).toBeVisible();
});

test("requests item details for newly selected item if selection is changed", async () => {
    const expectedItemName = items[1].name;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedItemDetailsQueryName,
        {
            filters: {
                name: expectedItemName,
                optimal: { maxAvailableTool: "NONE" },
            },
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOption({
        selectLabel: expectedItemSelectLabel,
        optionName: expectedItemName,
    });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        filters: {
            name: expectedItemName,
            optimal: { maxAvailableTool: "NONE" },
        },
    });
});

test("does not reset the currently selected item after changing tabs", async () => {
    const expected = items[1].name;

    render(<Calculator />);
    await selectOption({
        selectLabel: expectedItemSelectLabel,
        optionName: expected,
    });
    await openTab(expectedSettingsTab);
    await screen.findByRole("heading", {
        name: expectedSettingsTabHeader,
        level: 2,
    });
    await openTab(expectedCalculatorTab);

    expect(
        await screen.findByRole("combobox", { name: expectedItemSelectLabel })
    ).toHaveTextContent(expected);
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

afterAll(() => {
    server.close();
});
