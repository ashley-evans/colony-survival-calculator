import React from "react";
import { screen, within } from "@testing-library/react";
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
    expectedCalculatorTab,
    expectedSettingsTab,
    expectedCalculatorTabHeader,
    clickByName,
    expectedSettingsTabHeader,
    expectedCreatorOverrideQueryName,
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
        return res(
            ctx.data({ distinctItemNames: items.map((item) => item.name) })
        );
    }),
    graphql.query(expectedItemDetailsQueryName, (req, res, ctx) => {
        const { filters } = req.variables;
        const { name } = filters;
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
    }),
    graphql.query(expectedCreatorOverrideQueryName, (_, res, ctx) => {
        return res(
            ctx.data({
                item: [],
            })
        );
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
    server.events.removeAllListeners();
});

describe("tab rendering", async () => {
    test("renders a list of tabs", async () => {
        render(<Calculator />);

        expect(await screen.findByRole("tablist")).toBeVisible();
    });

    test.each([expectedCalculatorTab, expectedSettingsTab])(
        "renders the %s tab inside the tab list",
        async (expected: string) => {
            render(<Calculator />);
            const tablist = await screen.findByRole("tablist");

            expect(
                within(tablist).getByRole("tab", { name: expected })
            ).toBeVisible();
        }
    );

    test("renders the calculator tab as selected by default", async () => {
        render(<Calculator />);
        const tablist = await screen.findByRole("tablist");

        const calculatorTab = within(tablist).getByRole("tab", {
            name: expectedCalculatorTab,
            selected: true,
        });
        expect(calculatorTab).toBeVisible();
        expect(calculatorTab).toHaveAttribute("tabindex", "0");
    });

    test("renders the settings tab as not selected by default", async () => {
        render(<Calculator />);
        const tablist = await screen.findByRole("tablist");

        const settingsTab = within(tablist).getByRole("tab", {
            name: expectedSettingsTab,
            selected: false,
        });
        expect(settingsTab).toBeVisible();
        expect(settingsTab).toHaveAttribute("tabindex", "-1");
    });

    test("renders the calculator tab content inside a tab panel by default", async () => {
        render(<Calculator />);
        const panel = await screen.findByRole("tabpanel");

        expect(
            await within(panel).findByRole("heading", {
                level: 2,
                name: expectedCalculatorTabHeader,
            })
        ).toBeVisible();
    });

    test("sets the settings tab to selected if clicked", async () => {
        render(<Calculator />);
        await clickByName(expectedSettingsTab, "tab");

        const settingsTab = await screen.findByRole("tab", {
            name: expectedSettingsTab,
            selected: true,
        });
        expect(settingsTab).toBeVisible();
        expect(settingsTab).toHaveAttribute("tabindex", "0");
    });

    test("sets the calculator tab back to selected if re-opened", async () => {
        render(<Calculator />);
        const tablist = await screen.findByRole("tablist");
        await clickByName(expectedSettingsTab, "tab");
        await within(tablist).findByRole("tab", {
            name: expectedSettingsTab,
            selected: true,
        });
        await clickByName(expectedCalculatorTab, "tab");

        const calculatorTab = await within(tablist).findByRole("tab", {
            name: expectedCalculatorTab,
            selected: true,
        });
        expect(calculatorTab).toBeVisible();
        expect(calculatorTab).toHaveAttribute("tabindex", "0");
    });

    test("renders the settings tab content inside a tab panel if settings tab is selected", async () => {
        render(<Calculator />);
        await clickByName(expectedSettingsTab, "tab");
        const panel = await screen.findByRole("tabpanel");

        expect(
            await within(panel).findByRole("heading", {
                level: 2,
                name: expectedSettingsTabHeader,
            })
        ).toBeVisible();
    });

    test("does not render the settings tab if the calculator tab is selected (default)", async () => {
        render(<Calculator />);
        const panel = await screen.findByRole("tabpanel");
        await within(panel).findByRole("heading", {
            level: 2,
            name: expectedCalculatorTabHeader,
        });

        expect(
            within(panel).queryByRole("heading", {
                level: 2,
                name: expectedSettingsTabHeader,
            })
        ).not.toBeInTheDocument();
    });

    test("hides the settings tab if the calculator tab is re-opened", async () => {
        render(<Calculator />);
        await clickByName(expectedSettingsTab, "tab");
        const panel = await screen.findByRole("tabpanel");
        await within(panel).findByRole("heading", {
            level: 2,
            name: expectedSettingsTabHeader,
        });
        await clickByName(expectedCalculatorTab, "tab");

        expect(
            within(panel).queryByRole("heading", {
                level: 2,
                name: expectedSettingsTabHeader,
            })
        ).not.toBeInTheDocument();
    });

    test("hides the calculator tab if the settings tab is opened", async () => {
        render(<Calculator />);
        await clickByName(expectedSettingsTab, "tab");
        const panel = await screen.findByRole("tabpanel");
        await within(panel).findByRole("heading", {
            level: 2,
            name: expectedSettingsTabHeader,
        });

        expect(
            within(panel).queryByRole("heading", {
                level: 2,
                name: expectedCalculatorTabHeader,
            })
        ).not.toBeInTheDocument();
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

    test("does not reset worker input after tab is changed", async () => {
        const expectedWorkerValue = "24";

        render(<Calculator />);
        await selectItemAndWorkers({ workers: expectedWorkerValue });
        await clickByName(expectedSettingsTab, "tab");
        await screen.findByRole("heading", {
            name: expectedSettingsTabHeader,
            level: 2,
        });
        await clickByName(expectedCalculatorTab, "tab");

        expect(
            await screen.findByLabelText(expectedWorkerInputLabel, {
                selector: "input",
            })
        ).toHaveValue(expectedWorkerValue);
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
        await selectItemAndWorkers({
            itemName: items[0].name,
        });
        await screen.findByRole("alert");

        expect(
            screen.queryByText(expectedFarmSizeNotePrefix, { exact: false })
        ).not.toBeInTheDocument();
    });
});

afterAll(() => {
    server.close();
});
