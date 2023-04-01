import React from "react";
import { graphql, rest } from "msw";
import { setupServer } from "msw/node";
import { screen, within } from "@testing-library/react";

import { renderWithTestProviders as render } from "../../../test/utils";
import { Item, Items } from "../../../types";
import { Requirement } from "../../../graphql/__generated__/graphql";
import { STATIC_ITEMS_PATH } from "../../../utils";
import { waitForRequest } from "../../../helpers/utils";
import Calculator from "../Calculator";
import {
    selectItemAndWorkers,
    expectedRequirementsQueryName,
    expectedOutputQueryName,
} from "./utils";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedRequirementsHeading = "Requirements:";
const expectedItemNameColumnName = "Item";
const expectedWorkerColumnName = "Workers";

const requirements: Requirement[] = [
    {
        name: "Item 2",
        workers: 20,
    },
    {
        name: "Item 3",
        workers: 40,
    },
];
const itemsWithoutRequirements: Items = [
    {
        name: requirements[0].name,
        createTime: 5,
        output: 2,
        requires: [],
    },
    {
        name: requirements[1].name,
        createTime: 5,
        output: 2,
        requires: [],
    },
];
const itemWithSingleRequirement: Item = {
    name: "Item 1",
    createTime: 2,
    output: 1,
    requires: [{ name: requirements[0].name, amount: 3 }],
};
const itemWithMultipleRequirements: Item = {
    name: "Item 4",
    createTime: 2,
    output: 1,
    requires: [
        { name: requirements[0].name, amount: 3 },
        { name: requirements[1].name, amount: 5 },
    ],
};

const validItems = [
    itemWithSingleRequirement,
    itemWithMultipleRequirements,
    ...itemsWithoutRequirements,
];

const expectedOutput = 150;
const expectedOutputText = `Optimal output: ${expectedOutput} per minute`;

const server = setupServer(
    rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
        return res(ctx.json(validItems));
    }),
    graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
        return res(ctx.data({ requirement: [requirements[0]] }));
    }),
    graphql.query(expectedOutputQueryName, (_, res, ctx) => {
        return res(ctx.data({ output: expectedOutput }));
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
    server.events.removeAllListeners();
});

test("queries requirements if item and workers inputted", async () => {
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedRequirementsQueryName
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectItemAndWorkers({
        itemName: itemWithSingleRequirement.name,
        workers: expectedWorkers,
    });
    const [, body] = await expectedRequest;

    expect(body?.variables).toEqual({
        name: itemWithSingleRequirement.name,
        workers: expectedWorkers,
    });
});

describe("item w/o requirements handling", async () => {
    beforeEach(() => {
        server.use(
            graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
                return res.once(ctx.data({ requirement: [] }));
            })
        );
    });

    test("does not render the requirements section header", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });
        await screen.findByText(expectedOutputText);

        expect(
            screen.queryByRole("heading", {
                name: expectedRequirementsHeading,
            })
        ).not.toBeInTheDocument();
    });

    test("does not render the requirements table", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });
        await screen.findByText(expectedOutputText);

        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});

describe("response delay handling", () => {
    beforeEach(() => {
        server.use(
            graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
                return res.once(ctx.delay("infinite"));
            })
        );
    });

    test("does not render the requirements section header", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });
        await screen.findByText(expectedOutputText);

        expect(
            screen.queryByRole("heading", {
                name: expectedRequirementsHeading,
            })
        ).not.toBeInTheDocument();
    });

    test("does not render the requirements table", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });
        await screen.findByText(expectedOutputText);

        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});

describe("requirements rendering given requirements", () => {
    test("renders the requirements section header", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });

        expect(
            await screen.findByRole("heading", {
                name: expectedRequirementsHeading,
            })
        ).toBeVisible();
    });

    test("renders the requirements table", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });

        const requirementsTable = await screen.findByRole("table");
        expect(
            within(requirementsTable).getByRole("columnheader", {
                name: expectedItemNameColumnName,
            })
        ).toBeVisible();
        expect(
            within(requirementsTable).getByRole("columnheader", {
                name: expectedWorkerColumnName,
            })
        ).toBeVisible();
    });

    test.each([
        ["a single requirement", [requirements[0]]],
        ["multiple requirements", requirements],
    ])(
        "renders each requirement in the table given %s",
        async (_: string, expected: Requirement[]) => {
            server.use(
                graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
                    return res.once(ctx.data({ requirement: expected }));
                })
            );

            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: itemWithSingleRequirement.name,
                workers: 5,
            });
            const requirementsTable = await screen.findByRole("table");

            for (const requirement of expected) {
                expect(
                    within(requirementsTable).getByRole("cell", {
                        name: requirement.name,
                    })
                ).toBeVisible();
                expect(
                    within(requirementsTable).getByRole("cell", {
                        name: requirement.workers.toString(),
                    })
                ).toBeVisible();
            }
        }
    );

    test("ceils workers value if the returned value is returned as decimal", async () => {
        const actualWorkers = 3.14;
        const expectedWorkers = "4";
        server.use(
            graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
                return res.once(
                    ctx.data({
                        requirement: [
                            { ...requirements[0], workers: actualWorkers },
                        ],
                    })
                );
            })
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });
        const requirementsTable = await screen.findByRole("table");

        expect(
            within(requirementsTable).getByRole("cell", {
                name: expectedWorkers,
            })
        ).toBeVisible();
    });
});

describe("error handling", async () => {
    beforeEach(() => {
        server.use(
            graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
                return res.once(ctx.errors([{ message: "Error Message" }]));
            })
        );
    });

    test("renders an error message if an error occurs while fetching requirements", async () => {
        const expectedErrorMessage =
            "An error occurred while fetching requirements, please change item/workers and try again.";

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });

        expect(await screen.findByRole("alert")).toHaveTextContent(
            expectedErrorMessage
        );
    });

    test("does not render the requirements section header", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });
        await screen.findByText(expectedOutputText);

        expect(
            screen.queryByRole("heading", {
                name: expectedRequirementsHeading,
            })
        ).not.toBeInTheDocument();
    });

    test("does not render the requirements table", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });
        await screen.findByText(expectedOutputText);

        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});

afterAll(() => {
    server.close();
});
