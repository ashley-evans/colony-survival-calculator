import React from "react";
import { graphql } from "msw";
import { setupServer } from "msw/node";
import {
    screen,
    within,
    render as rtlRender,
    act,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import {
    renderWithTestProviders as render,
    wrapWithTestProviders,
} from "../../../test/utils";
import { Requirement } from "../../../graphql/__generated__/graphql";
import { waitForRequest } from "../../../helpers/utils";
import Calculator from "../Calculator";
import {
    selectItemAndWorkers,
    expectedRequirementsQueryName,
    expectedOutputQueryName,
    ItemName,
    expectedItemNameQueryName,
    expectedItemDetailsQueryName,
} from "./utils";
import Requirements from "../components/Requirements";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedRequirementsHeading = "Requirements:";
const expectedItemNameColumnName = "Item";
const expectedWorkerColumnName = "Workers";

const requirements: Requirement[] = [
    {
        name: "Required Item 1",
        workers: 20,
    },
    {
        name: "Required Item 2",
        workers: 40,
    },
];

const itemWithSingleRequirement: ItemName = {
    name: "Item w/ single requirement",
};
const itemWithMultipleRequirements: ItemName = {
    name: "Item w/ multiple requirements",
};

const items = [itemWithSingleRequirement, itemWithMultipleRequirements];

const expectedOutput = 150;
const expectedOutputText = `Optimal output: ${expectedOutput} per minute`;

const server = setupServer(
    graphql.query(expectedItemNameQueryName, (_, res, ctx) => {
        return res(
            ctx.data({ distinctItemNames: items.map((item) => item.name) })
        );
    }),
    graphql.query(expectedItemDetailsQueryName, (req, res, ctx) => {
        return res(ctx.data({ item: [] }));
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
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
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

    test("renders the workers column sort button", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });

        const requirementsTable = await screen.findByRole("table");
        expect(
            within(requirementsTable).getByRole("button", {
                name: expectedWorkerColumnName,
            })
        ).toBeVisible();
    });

    test("sets the worker column as unsorted (default sort) by default", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: itemWithSingleRequirement.name,
            workers: 5,
        });

        const requirementsTable = await screen.findByRole("table");
        const workersColumnHeader = within(requirementsTable).getByRole(
            "columnheader",
            { name: expectedWorkerColumnName }
        );
        expect(workersColumnHeader).toHaveAttribute("aria-sort", "none");
    });

    test.each([
        ["once", "descending", 1],
        ["twice", "ascending", 2],
        ["three times", "none", 3],
    ])(
        "pressing the worker column header %s sets the worker column sort to %s",
        async (_: string, expectedOrder: string, numberOfClicks: number) => {
            const user = userEvent.setup();

            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: itemWithSingleRequirement.name,
                workers: 5,
            });
            const requirementsTable = await screen.findByRole("table");
            const workersColumnHeader = within(requirementsTable).getByRole(
                "columnheader",
                { name: expectedWorkerColumnName }
            );
            for (let i = 0; i < numberOfClicks; i++) {
                await act(async () => {
                    await user.click(workersColumnHeader);
                });
            }

            await waitFor(() =>
                expect(workersColumnHeader).toHaveAttribute(
                    "aria-sort",
                    expectedOrder
                )
            );
        }
    );

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

    test.each([
        [
            "descending",
            [
                { name: "test item 1", workers: 1 },
                { name: "test item 2", workers: 2 },
            ],
            [
                { name: "test item 2", workers: 2 },
                { name: "test item 1", workers: 1 },
            ],
            1,
        ],
        [
            "ascending",
            [
                { name: "test item 1", workers: 2 },
                { name: "test item 2", workers: 1 },
            ],
            [
                { name: "test item 2", workers: 1 },
                { name: "test item 1", workers: 2 },
            ],
            2,
        ],
        [
            "default",
            [
                { name: "test item 1", workers: 1 },
                { name: "test item 2", workers: 2 },
            ],
            [
                { name: "test item 1", workers: 1 },
                { name: "test item 2", workers: 2 },
            ],
            3,
        ],
    ])(
        "displays the items in %s order by workers if workers column is sorted in that order",
        async (
            _: string,
            unsorted: Requirement[],
            sorted: Requirement[],
            numberOfClicks: number
        ) => {
            server.use(
                graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
                    return res.once(ctx.data({ requirement: unsorted }));
                })
            );

            const user = userEvent.setup();

            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: itemWithSingleRequirement.name,
                workers: 5,
            });
            const requirementsTable = await screen.findByRole("table");
            const workersColumnHeader = within(requirementsTable).getByRole(
                "columnheader",
                { name: expectedWorkerColumnName }
            );
            for (let i = 0; i < numberOfClicks; i++) {
                await act(async () => {
                    await user.click(workersColumnHeader);
                });
            }
            const requirementRows = await within(
                requirementsTable
            ).findAllByRole("row");

            for (let i = 0; i < sorted.length; i++) {
                const currentRow = requirementRows[i + 1];
                expect(
                    within(currentRow).getByText(sorted[i].name)
                ).toBeVisible();
                expect(
                    within(currentRow).getByText(sorted[i].workers)
                ).toBeVisible();
            }
        }
    );
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

describe("debounces requirement requests", () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    test("only requests requirements every 500ms on worker change", async () => {
        const expectedItemName = "test item";
        const expectedLastRequest = waitForRequest(
            server,
            "POST",
            expectedGraphQLAPIURL,
            expectedRequirementsQueryName,
            { name: expectedItemName, workers: 3 }
        );

        const { rerender } = rtlRender(
            wrapWithTestProviders(
                <Requirements
                    selectedItemName={expectedItemName}
                    workers={1}
                />,
                expectedGraphQLAPIURL
            )
        );
        rerender(
            wrapWithTestProviders(
                <Requirements
                    selectedItemName={expectedItemName}
                    workers={2}
                />,
                expectedGraphQLAPIURL
            )
        );
        rerender(
            wrapWithTestProviders(
                <Requirements
                    selectedItemName={expectedItemName}
                    workers={3}
                />,
                expectedGraphQLAPIURL
            )
        );
        act(() => {
            vi.advanceTimersByTime(500);
        });
        const { detailsUpToMatch } = await expectedLastRequest;

        expect(detailsUpToMatch).not.toContainEqual(
            expect.objectContaining({ workers: 2 })
        );
    });

    afterAll(() => {
        vi.useRealTimers();
    });
});

afterAll(() => {
    server.close();
});
