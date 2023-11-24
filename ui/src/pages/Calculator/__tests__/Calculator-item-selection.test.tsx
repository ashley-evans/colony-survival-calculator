import React from "react";
import { screen } from "@testing-library/react";
import { HttpResponse, delay, graphql } from "msw";
import { setupServer } from "msw/node";

import { waitForRequest } from "../../../helpers/utils";
import Calculator from "../Calculator";
import {
    openSelectMenu,
    renderWithTestProviders as render,
    selectOption,
} from "../../../test/utils";
import {
    expectedItemNameQueryName,
    expectedOutputUnitLabel,
    expectedItemSelectLabel,
    expectedWorkerInputLabel,
    ItemName,
    expectedCalculatorTabHeader,
    expectedToolSelectLabel,
    clickByName,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    expectedCalculatorTab,
    expectedCreatorOverrideQueryName,
} from "./utils";
import { expectedItemDetailsQueryName } from "./utils";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedMissingItemsError = "Unable to fetch known items";
const expectedNetworkExceptionError =
    "An error occurred fetching item details, please refresh the page and try again.";

const items: ItemName[] = [{ name: "Item 1" }, { name: "Item 2" }];

const server = setupServer(
    graphql.query(expectedItemNameQueryName, () => {
        return HttpResponse.json({
            data: {
                distinctItemNames: items.map((item) => item.name),
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
    createCalculatorOutputResponseHandler([]),
    graphql.query(expectedCreatorOverrideQueryName, () => {
        return HttpResponse.json({
            data: {
                item: [],
            },
        });
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
    server.events.removeAllListeners();
    server.use(
        graphql.query(expectedItemNameQueryName, () => {
            return HttpResponse.json({
                data: {
                    distinctItemNames: items.map((item) => item.name),
                },
            });
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
            graphql.query(expectedItemNameQueryName, async () => {
                await delay("infinite");
                return HttpResponse.json({});
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
            graphql.query(expectedItemNameQueryName, () => {
                return HttpResponse.json({
                    data: {
                        distinctItemNames: [],
                    },
                });
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

test("renders a select for the items if item names are returned", async () => {
    render(<Calculator />);

    expect(
        await screen.findByRole("combobox", {
            name: expectedItemSelectLabel,
        })
    ).toBeVisible();
});

test("renders a placeholder message for the item selector", async () => {
    render(<Calculator />);

    expect(
        await screen.findByRole("combobox", {
            name: expectedItemSelectLabel,
        })
    ).toHaveAttribute("placeholder", "Select an item to use in calculations");
});

test("renders each item name returned as an option in the item selector", async () => {
    render(<Calculator />);
    await openSelectMenu({ label: expectedItemSelectLabel });

    for (const expected of items) {
        expect(
            screen.getByRole("option", { name: expected.name })
        ).toBeVisible();
    }
});

test("renders the item selector with no assigned value by default", async () => {
    render(<Calculator />);
    await openSelectMenu({ label: expectedItemSelectLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedItemSelectLabel })
    ).toHaveValue("");
});

test("updates the selected option if selected is changed", async () => {
    const expected = items[1].name;

    render(<Calculator />);
    await selectOption({
        label: expectedItemSelectLabel,
        optionName: expected,
    });
    await openSelectMenu({ label: expectedItemSelectLabel });

    expect(
        await screen.findByRole("combobox", { name: expectedItemSelectLabel })
    ).toHaveValue(expected);
    expect(
        screen.getByRole("option", {
            name: expected,
            selected: true,
        })
    ).toBeVisible();
});

test("renders a clear button if an item is selected", async () => {
    const expectedClearButtonLabelText = "Clear item input";

    render(<Calculator />);
    await selectOption({
        label: expectedItemSelectLabel,
        optionName: items[1].name,
    });

    expect(
        await screen.findByRole("button", {
            name: expectedClearButtonLabelText,
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
                optimal: { maxAvailableTool: "NONE", hasMachineTools: false },
            },
        }
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOption({
        label: expectedItemSelectLabel,
        optionName: expectedItemName,
    });

    await expect(expectedRequest).resolves.not.toThrow();
});

test("does not reset the currently selected item after changing tabs", async () => {
    const expected = items[1].name;

    render(<Calculator />);
    await selectOption({
        label: expectedItemSelectLabel,
        optionName: expected,
    });
    await clickByName(expectedSettingsTab, "tab");
    await screen.findByRole("heading", {
        name: expectedSettingsTabHeader,
        level: 2,
    });
    await clickByName(expectedCalculatorTab, "tab");

    expect(
        await screen.findByRole("combobox", { name: expectedItemSelectLabel })
    ).toHaveValue(expected);
});

describe("item name request error handling", () => {
    beforeEach(() => {
        server.use(
            graphql.query(
                expectedItemNameQueryName,
                () => {
                    return HttpResponse.json({
                        errors: [{ message: "Error Message" }],
                    });
                },
                { once: true }
            )
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
        graphql.query(
            expectedItemDetailsQueryName,
            () => {
                return HttpResponse.json({
                    errors: [{ message: "Error Message" }],
                });
            },
            { once: true }
        )
    );

    render(<Calculator />);
    await selectOption({
        label: expectedItemSelectLabel,
        optionName: items[1].name,
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
        expectedNetworkExceptionError
    );
});

afterAll(() => {
    server.close();
});
