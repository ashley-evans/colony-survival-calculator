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
    ItemName,
    clickByName,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    expectedCreatorOverrideQueryName,
    expectedAddCreatorOverrideButtonText,
    openSelectMenu,
} from "./utils";
import { expectedItemDetailsQueryName } from "./utils";
import { CreatorOverride } from "../../../graphql/__generated__/graphql";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedLoadingMessage = "Loading overrides...";
const expectedNoOverridesMessage = "No overrides available";

const items: ItemName[] = [
    { name: "Item 1" },
    { name: "Item 2" },
    { name: "Item 3" },
];
const expectedCreatorOverrides: CreatorOverride[] = [
    ...generateItemCreatorOverrides(items[0].name, 2),
    ...generateItemCreatorOverrides(items[2].name, 3, 2),
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
    }),
    graphql.query(expectedCreatorOverrideQueryName, (_, res, ctx) => {
        return res(
            ctx.data({
                item: [
                    expectedCreatorOverrides.map(({ itemName, creator }) => ({
                        name: itemName,
                        creator,
                    })),
                ],
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
    server.use(
        graphql.query(expectedCreatorOverrideQueryName, (_, res, ctx) => {
            return res(
                ctx.data({
                    item: [
                        expectedCreatorOverrides.map(
                            ({ itemName, creator }) => ({
                                name: itemName,
                                creator,
                            })
                        ),
                    ],
                })
            );
        })
    );
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
            graphql.query(expectedCreatorOverrideQueryName, (_, res, ctx) => {
                return res(ctx.delay("infinite"));
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
            graphql.query(expectedCreatorOverrideQueryName, (_, res, ctx) => {
                return res(
                    ctx.data({
                        item: [],
                    })
                );
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
        const expectedItemSelectOverrideLabel = "Item:";
        const expectedCreatorSelectOverrideLabel = "Creator:";
        const expectedItemName = "Test item";
        const expectedOverrides = generateItemCreatorOverrides(
            expectedItemName,
            2
        );

        beforeEach(() => {
            server.use(
                graphql.query(
                    expectedCreatorOverrideQueryName,
                    (_, res, ctx) => {
                        return res(
                            ctx.data({
                                item: expectedOverrides.map(
                                    ({ itemName, creator }) => ({
                                        name: itemName,
                                        creator,
                                    })
                                ),
                            })
                        );
                    }
                )
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
                selectLabel: expectedItemSelectOverrideLabel,
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
                selectLabel: expectedItemSelectOverrideLabel,
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
                selectLabel: expectedCreatorSelectOverrideLabel,
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
                selectLabel: expectedCreatorSelectOverrideLabel,
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
    });
});

afterAll(() => {
    server.close();
});
