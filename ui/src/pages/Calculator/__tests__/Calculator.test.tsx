import { screen, within } from "@testing-library/react";
import { HttpResponse, graphql } from "msw";
import { setupServer } from "msw/node";

import Calculator from "../Calculator";
import { renderWithTestProviders as render } from "../../../test/utils";
import {
    expectedItemNameQueryName,
    selectItemAndTarget,
    expectedItemSelectLabel,
    expectedFarmSizeNotePrefix,
    ItemName,
    expectedCalculatorTab,
    expectedSettingsTab,
    expectedCalculatorTabHeader,
    clickByName,
    expectedSettingsTabHeader,
    expectedCreatorOverrideQueryName,
    expectedAboutTab,
    expectedAboutVersionExplanation,
    expectedGameDataReferenceRepositoryLink,
    expectedGameDataReferenceRepositoryLinkText,
    expectedGameDataReferenceRepositoryExplanation,
} from "./utils";
import { expectedItemDetailsQueryName } from "./utils";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";

const itemWithoutFarmSize: ItemName = {
    id: "itemwofarm",
    name: "item w/o farm",
};
const itemWithFarmSize: ItemName = {
    id: "itemwithfarm",
    name: "item with farm",
};
const expectedFarmSizeDetails = {
    id: itemWithFarmSize.id,
    creatorID: "creator1",
    size: { width: 20, height: 4 },
};
const items = [itemWithFarmSize, itemWithoutFarmSize];

const server = setupServer(
    graphql.query(expectedItemNameQueryName, () => {
        return HttpResponse.json({
            data: {
                distinctItemNames: items,
            },
        });
    }),
    graphql.query(expectedItemDetailsQueryName, ({ variables }) => {
        const { filters } = variables;
        const { id } = filters;
        if (id === itemWithFarmSize.id) {
            return HttpResponse.json({
                data: { item: [expectedFarmSizeDetails] },
            });
        }

        return HttpResponse.json({ data: { item: [] } });
    }),
    createCalculatorOutputResponseHandler([]),
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

describe("tab rendering", async () => {
    test("renders a list of tabs", async () => {
        render(<Calculator />);

        expect(await screen.findByRole("tablist")).toBeVisible();
    });

    test.each([expectedCalculatorTab, expectedSettingsTab, expectedAboutTab])(
        "renders the %s tab inside the tab list",
        async (expected: string) => {
            render(<Calculator />);
            const tablist = await screen.findByRole("tablist");

            expect(
                within(tablist).getByRole("tab", { name: expected }),
            ).toBeVisible();
        },
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

    test("renders the about tab as not selected by default", async () => {
        render(<Calculator />);
        const tablist = await screen.findByRole("tablist");

        const settingsTab = within(tablist).getByRole("tab", {
            name: expectedAboutTab,
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
            }),
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

    test("sets the about tab to selected if clicked", async () => {
        render(<Calculator />);
        await clickByName(expectedAboutTab, "tab");

        const aboutTab = await screen.findByRole("tab", {
            name: expectedAboutTab,
            selected: true,
        });
        expect(aboutTab).toBeVisible();
        expect(aboutTab).toHaveAttribute("tabindex", "0");
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
            }),
        ).toBeVisible();
    });

    test("renders the about tab content inside a tab panel if about tab is selected", async () => {
        render(<Calculator />);
        await clickByName(expectedAboutTab, "tab");
        const panel = await screen.findByRole("tabpanel");

        expect(
            await within(panel).findByText(expectedAboutVersionExplanation),
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
            }),
        ).not.toBeInTheDocument();
    });

    test("does not render the about tab if the calculator tab is selected (default)", async () => {
        render(<Calculator />);
        const panel = await screen.findByRole("tabpanel");
        await within(panel).findByRole("heading", {
            level: 2,
            name: expectedCalculatorTabHeader,
        });

        expect(
            within(panel).queryByText(expectedAboutVersionExplanation),
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
            }),
        ).not.toBeInTheDocument();
    });

    test("hides the about tab if the calculator tab is re-opened", async () => {
        render(<Calculator />);
        await clickByName(expectedAboutTab, "tab");
        const panel = await screen.findByRole("tabpanel");
        await within(panel).findByText(expectedAboutVersionExplanation);
        await clickByName(expectedCalculatorTab, "tab");

        expect(
            within(panel).queryByText(expectedAboutVersionExplanation),
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
            }),
        ).not.toBeInTheDocument();
    });
});

describe("optimal farm size note rendering", () => {
    test("renders the optimal height and width of the farm if provided", async () => {
        const expectedMessage = `${expectedFarmSizeNotePrefix} ${expectedFarmSizeDetails.size.width} x ${expectedFarmSizeDetails.size.height}`;

        render(<Calculator />);
        await selectItemAndTarget({ itemName: itemWithFarmSize.name });

        expect(await screen.findByText(expectedMessage)).toBeVisible();
    });

    test("does not render optimal farm size message if no size provided", async () => {
        render(<Calculator />);
        await selectItemAndTarget({ itemName: itemWithoutFarmSize.name });
        await screen.findByRole("combobox", { name: expectedItemSelectLabel });

        expect(
            screen.queryByText(expectedFarmSizeNotePrefix, { exact: false }),
        ).not.toBeInTheDocument();
    });

    test("does not render optimal farm size message if item details could not fetched", async () => {
        server.use(
            graphql.query(
                expectedItemDetailsQueryName,
                () => {
                    return HttpResponse.json({
                        errors: [{ message: "Error Message" }],
                    });
                },
                { once: true },
            ),
        );

        render(<Calculator />);
        await selectItemAndTarget({
            itemName: items[0].name,
        });
        await screen.findByRole("alert");

        expect(
            screen.queryByText(expectedFarmSizeNotePrefix, { exact: false }),
        ).not.toBeInTheDocument();
    });
});

describe("about tab rendering", () => {
    test("renders a link to reference game data Github repository", async () => {
        render(<Calculator />);
        await clickByName(expectedAboutTab, "tab");
        const panel = await screen.findByRole("tabpanel");

        const link = await within(panel).findByRole("link", {
            name: expectedGameDataReferenceRepositoryLinkText,
        });
        expect(link).toHaveAttribute(
            "href",
            expectedGameDataReferenceRepositoryLink,
        );
        expect(link.parentElement).toHaveTextContent(
            expectedGameDataReferenceRepositoryExplanation,
        );
    });
});

afterAll(() => {
    server.close();
});
