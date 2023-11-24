import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { delay, graphql, HttpResponse } from "msw";
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
    ItemName,
    clickByName,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    expectedCreatorOverrideQueryName,
    expectedAddCreatorOverrideButtonText,
    expectedRemoveCreatorOverrideButtonText,
    expectedCalculatorTab,
    expectedCalculatorTabHeader,
    selectItemAndTarget,
    expectedCalculatorOutputQueryName,
    createRequirement,
    createRequirementCreator,
    expectedRequirementsHeading,
} from "./utils";
import { expectedItemDetailsQueryName } from "./utils";
import {
    CreatorOverride,
    OutputUnit,
    AvailableTools,
} from "../../../graphql/__generated__/graphql";
import userEvent from "@testing-library/user-event";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedLoadingMessage = "Loading overrides...";
const expectedNoOverridesMessage = "No overrides available";
const expectedItemSelectOverrideLabel = "Item:";
const expectedCreatorSelectOverrideLabel = "Creator:";

const items: ItemName[] = [
    { name: "Item 1" },
    { name: "Item 2" },
    { name: "Item 3" },
];

const expectedFirstItemName = items[0].name;
const expectedFirstItemOverrides = generateItemCreatorOverrides(
    expectedFirstItemName,
    2
);
const expectedSecondItemName = items[2].name;
const expectedSecondItemOverrides = generateItemCreatorOverrides(
    expectedSecondItemName,
    3,
    2
);

const expectedCreatorOverrides: CreatorOverride[] = [
    ...expectedFirstItemOverrides,
    ...expectedSecondItemOverrides,
];

function generateItemCreatorOverrides(
    name: string,
    amount: number,
    creatorOffset = 0
): CreatorOverride[] {
    const overrides: CreatorOverride[] = [];
    for (let i = 0; i < amount; i++) {
        overrides.push({
            itemName: name,
            creator: `${name} creator - ${i + 1 + creatorOffset}`,
        });
    }

    return overrides;
}

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
    createCalculatorOutputResponseHandler([
        createRequirement({
            name: items[0].name,
            amount: 1,
            creators: [
                createRequirementCreator({
                    recipeName: items[0].name,
                    workers: 1,
                    amount: 1,
                    creator: "Creator",
                    demands: [],
                }),
            ],
        }),
    ]),
    graphql.query(expectedCreatorOverrideQueryName, () => {
        return HttpResponse.json({
            data: {
                item: expectedCreatorOverrides.map(({ itemName, creator }) => ({
                    name: itemName,
                    creator,
                })),
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
});

async function renderSettingsTab(apiURL = expectedGraphQLAPIURL) {
    render(<Calculator />, apiURL);
    await clickByName(expectedSettingsTab, "tab");
    await screen.findByRole("heading", {
        name: expectedSettingsTabHeader,
        level: 2,
    });
}

test("queries all known item names", async () => {
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedCreatorOverrideQueryName
    );

    await renderSettingsTab();

    await expect(expectedRequest).resolves.not.toThrow();
});

test("displays optimal default calculation explanation", async () => {
    const expectedExplanationText =
        "By default, the calculator will use the recipe with the highest output per second unless an override is applied.";

    await renderSettingsTab();

    expect(screen.getByText(expectedExplanationText)).toBeVisible();
});

describe("handles creator override list loading", () => {
    beforeEach(() => {
        server.use(
            graphql.query(expectedCreatorOverrideQueryName, async () => {
                await delay("infinite");
                return HttpResponse.json({});
            })
        );
    });

    test("renders a loading message", async () => {
        await renderSettingsTab();

        expect(await screen.findByText(expectedLoadingMessage)).toBeVisible();
    });

    test("does not render any error messages", async () => {
        await renderSettingsTab();

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    test("does not render an add creator override button", async () => {
        await renderSettingsTab();

        expect(
            screen.queryByRole("button", {
                name: expectedAddCreatorOverrideButtonText,
            })
        ).not.toBeInTheDocument();
    });
});

describe("given no creator overrides returned", () => {
    beforeEach(() => {
        server.use(
            graphql.query(expectedCreatorOverrideQueryName, () => {
                return HttpResponse.json({
                    data: {
                        item: [],
                    },
                });
            })
        );
    });

    test("renders a missing overrides error", async () => {
        await renderSettingsTab();

        expect(await screen.findByRole("alert")).toHaveTextContent(
            expectedNoOverridesMessage
        );
    });

    test("does not render a loading message once data loaded", async () => {
        await renderSettingsTab();
        await screen.findByRole("alert");

        expect(
            screen.queryByText(expectedLoadingMessage)
        ).not.toBeInTheDocument();
    });

    test("does not render an add creator override button", async () => {
        await renderSettingsTab();
        await screen.findByRole("alert");

        expect(
            screen.queryByRole("button", {
                name: expectedAddCreatorOverrideButtonText,
            })
        ).not.toBeInTheDocument();
    });
});

describe("given items w/ multiple creators returned", () => {
    test("does not render any errors", async () => {
        await renderSettingsTab();

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    test("renders an add creator override button", async () => {
        await renderSettingsTab();

        expect(
            await screen.findByRole("button", {
                name: expectedAddCreatorOverrideButtonText,
            })
        ).toBeVisible();
    });

    test("does not render any item override selectors by default", async () => {
        await renderSettingsTab();
        await screen.findByRole("button", {
            name: expectedAddCreatorOverrideButtonText,
        });

        expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    });

    describe("one item w/ multiple creator returned", () => {
        const expectedItemName = "Test item";
        const expectedOverrides = generateItemCreatorOverrides(
            expectedItemName,
            2
        );

        beforeEach(() => {
            server.use(
                graphql.query(expectedCreatorOverrideQueryName, () => {
                    return HttpResponse.json({
                        data: {
                            item: expectedOverrides.map(
                                ({ itemName, creator }) => ({
                                    name: itemName,
                                    creator,
                                })
                            ),
                        },
                    });
                })
            );
        });

        test("renders a select to allow the item to override to be selected", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");

            expect(
                await screen.findByRole("combobox", {
                    name: expectedItemSelectOverrideLabel,
                })
            ).toBeVisible();
        });

        test("renders the item's name as the selected and only item in the item override select", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await openSelectMenu({
                label: expectedItemSelectOverrideLabel,
            });

            expect(
                await screen.findByRole("combobox", {
                    name: expectedItemSelectOverrideLabel,
                })
            ).toHaveTextContent(expectedItemName);
            expect(screen.getAllByRole("option")).toHaveLength(1);
            expect(
                screen.getByRole("option", {
                    name: expectedItemName,
                    selected: true,
                })
            ).toBeVisible();
        });

        test("renders a select to allow the item to override to be selected", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");

            expect(
                await screen.findByRole("combobox", {
                    name: expectedItemSelectOverrideLabel,
                })
            ).toBeVisible();
        });

        test("renders the item's name as the selected and only item in the item override select", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await openSelectMenu({
                label: expectedItemSelectOverrideLabel,
            });

            expect(
                await screen.findByRole("combobox", {
                    name: expectedItemSelectOverrideLabel,
                })
            ).toHaveTextContent(expectedItemName);
            expect(screen.getAllByRole("option")).toHaveLength(1);
            expect(
                screen.getByRole("option", {
                    name: expectedItemName,
                    selected: true,
                })
            ).toBeVisible();
        });

        test("renders a select to allow a specific creator to be selected", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");

            expect(
                await screen.findByRole("combobox", {
                    name: expectedCreatorSelectOverrideLabel,
                })
            ).toBeVisible();
        });

        test("renders each creator returned for item as an option in the creator select", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await openSelectMenu({
                label: expectedCreatorSelectOverrideLabel,
            });

            for (const { creator } of expectedOverrides) {
                expect(
                    await screen.findByRole("option", { name: creator })
                ).toBeVisible();
            }
        });

        test("renders the first creator returned as the default selected option", async () => {
            const expectedDefaultCreator = expectedOverrides[0].creator;

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await openSelectMenu({
                label: expectedCreatorSelectOverrideLabel,
            });

            expect(
                await screen.findByRole("combobox", {
                    name: expectedCreatorSelectOverrideLabel,
                })
            ).toHaveTextContent(expectedOverrides[0].creator);
            expect(
                screen.getByRole("option", {
                    name: expectedDefaultCreator,
                    selected: true,
                })
            ).toBeVisible();
        });

        test("removes the add creator override button once override is added", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await screen.findByRole("combobox", {
                name: expectedCreatorSelectOverrideLabel,
            });

            expect(
                screen.queryByRole("button", {
                    name: expectedAddCreatorOverrideButtonText,
                })
            ).not.toBeInTheDocument();
        });

        test("displays a remove creator override button once an override is added", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");

            expect(
                await screen.findByRole("button", {
                    name: expectedRemoveCreatorOverrideButtonText,
                })
            ).toBeVisible();
        });

        test("re-displays the add creator override if the added override is removed", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await screen.findByRole("combobox", {
                name: expectedCreatorSelectOverrideLabel,
            });
            await clickByName(
                expectedRemoveCreatorOverrideButtonText,
                "button"
            );

            expect(
                await screen.findByRole("button", {
                    name: expectedAddCreatorOverrideButtonText,
                })
            ).toBeVisible();
        });

        test("removes the creator override if the remove button is pressed", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await screen.findByRole("combobox", {
                name: expectedCreatorSelectOverrideLabel,
            });
            await clickByName(
                expectedRemoveCreatorOverrideButtonText,
                "button"
            );
            await screen.findByRole("button", {
                name: expectedAddCreatorOverrideButtonText,
            });

            expect(
                screen.queryByRole("combobox", {
                    name: expectedCreatorSelectOverrideLabel,
                })
            ).not.toBeInTheDocument();
        });
    });

    describe("multiple items w/ multiple creator returned", () => {
        test("renders the first item as selected in the item override select if only one override is added", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await openSelectMenu({
                label: expectedItemSelectOverrideLabel,
            });

            expect(
                await screen.findByRole("combobox", {
                    name: expectedItemSelectOverrideLabel,
                })
            ).toHaveTextContent(expectedFirstItemName);
            expect(
                screen.getByRole("option", {
                    name: expectedFirstItemName,
                    selected: true,
                })
            ).toBeVisible();
        });

        test("renders both items in the select options if only one override is added", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await openSelectMenu({
                label: expectedItemSelectOverrideLabel,
            });

            expect(
                await screen.findByRole("option", {
                    name: expectedFirstItemName,
                })
            ).toBeVisible();
            expect(
                screen.getByRole("option", {
                    name: expectedSecondItemName,
                })
            ).toBeVisible();
        });

        test("renders only the creators related to the selected overridden item in the creator override select options", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await openSelectMenu({
                label: expectedCreatorSelectOverrideLabel,
            });

            const creatorOptions = await screen.findAllByRole("option");
            expect(creatorOptions).toHaveLength(
                expectedFirstItemOverrides.length
            );
            for (const { creator } of expectedFirstItemOverrides) {
                expect(
                    screen.getByRole("option", { name: creator })
                ).toBeVisible();
            }
        });

        test("changing the selected overridden item updates the creators to the applicable creators for that item", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await selectOption({
                label: expectedItemSelectOverrideLabel,
                optionName: expectedSecondItemName,
            });
            await openSelectMenu({
                label: expectedCreatorSelectOverrideLabel,
            });

            const creatorOptions = await screen.findAllByRole("option");
            expect(creatorOptions).toHaveLength(
                expectedSecondItemOverrides.length
            );
            for (const { creator } of expectedSecondItemOverrides) {
                expect(
                    screen.getByRole("option", { name: creator })
                ).toBeVisible();
            }
        });

        test("changing the selected overridden item sets the default selected creator as the first creator for that item", async () => {
            const expectedCreator = expectedSecondItemOverrides[0].creator;

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await selectOption({
                label: expectedItemSelectOverrideLabel,
                optionName: expectedSecondItemName,
            });
            await openSelectMenu({
                label: expectedCreatorSelectOverrideLabel,
            });

            expect(
                await screen.findByRole("combobox", {
                    name: expectedCreatorSelectOverrideLabel,
                })
            ).toHaveTextContent(expectedCreator);
            expect(
                screen.getByRole("option", {
                    name: expectedCreator,
                    selected: true,
                })
            ).toBeVisible();
        });

        test("still displays add creator override button if additional overrides can be added", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await screen.findByRole("combobox", {
                name: expectedItemSelectOverrideLabel,
            });

            expect(
                await screen.findByRole("button", {
                    name: expectedAddCreatorOverrideButtonText,
                })
            ).toBeVisible();
        });

        test("renders two creator override selects if two creator overrides are added", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedAddCreatorOverrideButtonText, "button");

            expect(
                await screen.findAllByRole("combobox", {
                    name: expectedItemSelectOverrideLabel,
                })
            ).toHaveLength(2);
            expect(
                screen.getAllByRole("combobox", {
                    name: expectedCreatorSelectOverrideLabel,
                })
            ).toHaveLength(2);
        });

        test("sets the second creator override to the second item by default", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedAddCreatorOverrideButtonText, "button");

            const itemOverrideSelects = await screen.findAllByRole("combobox", {
                name: expectedItemSelectOverrideLabel,
            });
            expect(itemOverrideSelects[1]).toHaveTextContent(
                expectedSecondItemName
            );
        });

        test.each([
            ["second", "first", 0, expectedSecondItemName],
            ["first", "second", 1, expectedFirstItemName],
        ])(
            "does not render the second creator override's item in the first creator override option list",
            async (
                _: string,
                __: string,
                index: number,
                expectedMissingItem: string
            ) => {
                const user = userEvent.setup();

                await renderSettingsTab();
                await clickByName(
                    expectedAddCreatorOverrideButtonText,
                    "button"
                );
                await clickByName(
                    expectedAddCreatorOverrideButtonText,
                    "button"
                );
                const itemOverrideSelects = await screen.findAllByRole(
                    "combobox",
                    {
                        name: expectedItemSelectOverrideLabel,
                    }
                );
                await user.click(itemOverrideSelects[index]);

                expect(
                    screen.queryByRole("option", {
                        name: expectedMissingItem,
                    })
                ).not.toBeInTheDocument();
            }
        );

        test("re-adds the other item as an option if the related item's creator override is removed", async () => {
            const user = userEvent.setup();

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            const removeButtons = await screen.findAllByRole("button", {
                name: expectedRemoveCreatorOverrideButtonText,
            });
            await user.click(removeButtons[0]);
            await openSelectMenu({
                label: expectedItemSelectOverrideLabel,
            });

            expect(
                await screen.findByRole("option", {
                    name: expectedSecondItemName,
                    selected: true,
                })
            ).toBeVisible();
            expect(
                screen.getByRole("option", { name: expectedFirstItemName })
            ).toBeVisible();
        });

        test("does not display an add creator override button if no further overrides can be added", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedAddCreatorOverrideButtonText, "button");

            await waitFor(() => {
                expect(
                    screen.queryByRole("button", {
                        name: expectedAddCreatorOverrideButtonText,
                    })
                ).not.toBeInTheDocument();
            });
        });

        test("does not reset the currently selected item overrides if tab changes", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedCalculatorTab, "tab");
            await screen.findByRole("heading", {
                name: expectedCalculatorTabHeader,
                level: 2,
            });
            await clickByName(expectedSettingsTab, "tab");
            await screen.findByRole("heading", {
                name: expectedSettingsTabHeader,
                level: 2,
            });

            const itemOverrideSelects = await screen.findAllByRole("combobox", {
                name: expectedItemSelectOverrideLabel,
            });
            expect(itemOverrideSelects[0]).toHaveTextContent(
                expectedFirstItemName
            );
            expect(itemOverrideSelects[1]).toHaveTextContent(
                expectedSecondItemName
            );
        });

        test("does not reset the currently selected creator overrides if tab changes", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedCalculatorTab, "tab");
            await screen.findByRole("heading", {
                name: expectedCalculatorTabHeader,
                level: 2,
            });
            await clickByName(expectedSettingsTab, "tab");
            await screen.findByRole("heading", {
                name: expectedSettingsTabHeader,
                level: 2,
            });

            const creatorOverrideSelects = screen.getAllByRole("combobox", {
                name: expectedCreatorSelectOverrideLabel,
            });
            expect(creatorOverrideSelects[0]).toHaveTextContent(
                expectedFirstItemOverrides[0].creator
            );
            expect(creatorOverrideSelects[1]).toHaveTextContent(
                expectedSecondItemOverrides[0].creator
            );
        });

        test("does not reset the currently selected item override if non-default item selected", async () => {
            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await selectOption({
                label: expectedItemSelectOverrideLabel,
                optionName: expectedSecondItemName,
            });
            await clickByName(expectedCalculatorTab, "tab");
            await screen.findByRole("heading", {
                name: expectedCalculatorTabHeader,
                level: 2,
            });
            await clickByName(expectedSettingsTab, "tab");
            await screen.findByRole("heading", {
                name: expectedSettingsTabHeader,
                level: 2,
            });

            expect(
                screen.getByRole("combobox", {
                    name: expectedItemSelectOverrideLabel,
                })
            ).toHaveTextContent(expectedSecondItemName);
        });

        test("does not reset the currently selected creator override if non-default creator selected", async () => {
            const expected = expectedFirstItemOverrides[1].creator;

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await selectOption({
                label: expectedCreatorSelectOverrideLabel,
                optionName: expected,
            });
            await clickByName(expectedCalculatorTab, "tab");
            await screen.findByRole("heading", {
                name: expectedCalculatorTabHeader,
                level: 2,
            });
            await clickByName(expectedSettingsTab, "tab");
            await screen.findByRole("heading", {
                name: expectedSettingsTabHeader,
                level: 2,
            });

            expect(
                screen.getByRole("combobox", {
                    name: expectedCreatorSelectOverrideLabel,
                })
            ).toHaveTextContent(expected);
        });

        test("queries item details with specified creator if applicable override enabled", async () => {
            const expectedItem = expectedSecondItemName;
            const expectedCreator = expectedSecondItemOverrides[1].creator;
            const expectedRequest = waitForRequest(
                server,
                "POST",
                expectedGraphQLAPIURL,
                expectedItemDetailsQueryName,
                {
                    filters: {
                        name: expectedItem,
                        creator: expectedCreator,
                    },
                }
            );

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await selectOption({
                label: expectedItemSelectOverrideLabel,
                optionName: expectedItem,
            });
            await selectOption({
                label: expectedCreatorSelectOverrideLabel,
                optionName: expectedCreator,
            });
            await clickByName(expectedCalculatorTab, "tab");
            await selectItemAndTarget({ itemName: expectedItem });

            await expect(expectedRequest).resolves.not.toThrow();
        });

        test("returns to querying optimal recipe if applicable override is removed", async () => {
            const expectedItem = expectedSecondItemName;
            const expectedTool = AvailableTools.None;
            const expectedRequest = waitForRequest(
                server,
                "POST",
                expectedGraphQLAPIURL,
                expectedItemDetailsQueryName,
                {
                    filters: {
                        name: expectedItem,
                        optimal: {
                            maxAvailableTool: expectedTool,
                            hasMachineTools: false,
                        },
                    },
                }
            );

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await selectOption({
                label: expectedItemSelectOverrideLabel,
                optionName: expectedItem,
            });
            await selectOption({
                label: expectedCreatorSelectOverrideLabel,
                optionName: expectedSecondItemOverrides[1].creator,
            });
            await clickByName(expectedCalculatorTab, "tab");
            await selectItemAndTarget({ itemName: expectedItem });
            await clickByName(expectedSettingsTab, "tab");
            await clickByName(
                expectedRemoveCreatorOverrideButtonText,
                "button"
            );
            await clickByName(expectedCalculatorTab, "tab");

            await expect(expectedRequest).resolves.not.toThrow();
        });

        test("provides all creator overrides when querying calculator output", async () => {
            const user = userEvent.setup();
            const expectedItem = expectedSecondItemName;
            const expectedCreator = expectedSecondItemOverrides[1].creator;
            const expectedWorkers = 5;
            const expectedOverrides: CreatorOverride[] = [
                {
                    itemName: expectedFirstItemName,
                    creator: expectedFirstItemOverrides[1].creator,
                },
                {
                    itemName: expectedSecondItemName,
                    creator: expectedCreator,
                },
            ];
            const expectedTool = AvailableTools.None;
            const expectedRequest = waitForRequest(
                server,
                "POST",
                expectedGraphQLAPIURL,
                expectedCalculatorOutputQueryName
            );

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            const creatorOverrideSelects = await screen.findAllByRole(
                "combobox",
                { name: expectedCreatorSelectOverrideLabel }
            );
            await user.click(creatorOverrideSelects[0]);
            const firstItemCreatorOption = await screen.findByRole("option", {
                name: expectedFirstItemOverrides[1].creator,
            });
            await user.click(firstItemCreatorOption);
            await user.click(creatorOverrideSelects[1]);
            const secondItemCreatorOption = await screen.findByRole("option", {
                name: expectedSecondItemOverrides[1].creator,
            });
            await user.click(secondItemCreatorOption);
            await clickByName(expectedCalculatorTab, "tab");
            await selectItemAndTarget({
                itemName: expectedItem,
                workers: expectedWorkers,
            });
            await screen.findByRole("heading", {
                name: expectedRequirementsHeading,
            });
            const { matchedRequestDetails } = await expectedRequest;

            expect(matchedRequestDetails.variables).toEqual({
                name: expectedItem,
                workers: expectedWorkers,
                unit: OutputUnit.Minutes,
                maxAvailableTool: expectedTool,
                hasMachineTools: false,
                creatorOverrides: expectedOverrides,
            });
        });

        test("returns to querying calculator output without creator overrides if removed", async () => {
            const expectedItem = expectedSecondItemName;
            const expectedWorkers = 5;
            const expectedTool = AvailableTools.None;
            const expectedRequest = waitForRequest(
                server,
                "POST",
                expectedGraphQLAPIURL,
                expectedCalculatorOutputQueryName,
                {
                    name: expectedItem,
                    workers: expectedWorkers,
                    unit: OutputUnit.Minutes,
                    maxAvailableTool: expectedTool,
                    hasMachineTools: false,
                }
            );

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await clickByName(expectedCalculatorTab, "tab");
            await selectItemAndTarget({
                itemName: expectedItem,
                workers: expectedWorkers,
            });
            await clickByName(expectedSettingsTab, "tab");
            await clickByName(
                expectedRemoveCreatorOverrideButtonText,
                "button"
            );
            await clickByName(expectedCalculatorTab, "tab");

            await expect(expectedRequest).resolves.not.toThrow();
        });

        test("queries output with specified creator if applicable override enabled", async () => {
            const expectedItem = expectedSecondItemName;
            const expectedCreator = expectedSecondItemOverrides[1].creator;
            const expectedWorkers = 5;
            const expectedTool = AvailableTools.None;
            const expectedOutputUnit = OutputUnit.Minutes;
            const expectedOverrides: CreatorOverride[] = [
                {
                    itemName: expectedSecondItemName,
                    creator: expectedCreator,
                },
            ];
            const expectedRequest = waitForRequest(
                server,
                "POST",
                expectedGraphQLAPIURL,
                expectedCalculatorOutputQueryName
            );

            await renderSettingsTab();
            await clickByName(expectedAddCreatorOverrideButtonText, "button");
            await selectOption({
                label: expectedItemSelectOverrideLabel,
                optionName: expectedItem,
            });
            await selectOption({
                label: expectedCreatorSelectOverrideLabel,
                optionName: expectedCreator,
            });
            await clickByName(expectedCalculatorTab, "tab");
            await selectItemAndTarget({
                itemName: expectedItem,
                workers: expectedWorkers,
            });
            await screen.findByRole("heading", {
                name: expectedRequirementsHeading,
            });
            const { matchedRequestDetails } = await expectedRequest;

            expect(matchedRequestDetails.variables).toEqual({
                name: expectedItem,
                workers: expectedWorkers,
                unit: expectedOutputUnit,
                maxAvailableTool: expectedTool,
                hasMachineTools: false,
                creatorOverrides: expectedOverrides,
            });
        });
    });
});

afterAll(() => {
    server.close();
});
