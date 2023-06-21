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
    openTab,
    expectedSettingsTab,
    expectedSettingsTabHeader,
    expectedCreatorOverrideQueryName,
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
    { itemName: items[0].name, creator: "Creator 1" },
    { itemName: items[0].name, creator: "Creator 2" },
    { itemName: items[2].name, creator: "Creator 3" },
    { itemName: items[2].name, creator: "Creator 4" },
    { itemName: items[2].name, creator: "Creator 5" },
];

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
    await openTab(expectedSettingsTab);
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
});

describe("given creator overrides returned", async () => {
    test("does not render any errors", async () => {
        await renderSettingsTab();

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});

afterAll(() => {
    server.close();
});
