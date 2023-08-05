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
import { GetItemRequirementsQuery } from "../../../graphql/__generated__/graphql";
import { waitForRequest } from "../../../helpers/utils";
import Calculator from "../Calculator";
import {
    selectItemAndWorkers,
    expectedRequirementsQueryName,
    expectedOutputQueryName,
    expectedItemNameQueryName,
    expectedItemDetailsQueryName,
    expectedCreatorOverrideQueryName,
} from "./utils";
import Requirements from "../components/Requirements";
import { RequirementsTableRow } from "../components/Requirements/Requirements";

type RequirementsResponse = GetItemRequirementsQuery["requirement"][number];
type RequirementCreator = RequirementsResponse["creators"][number];

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedRequirementsHeading = "Requirements:";
const expectedItemNameColumnName = "Item";
const expectedAmountColumnName = "Amount";
const expectedWorkerColumnName = "Workers";

function createRequirementCreator({
    name,
    workers,
}: {
    name: string;
    workers: number;
}): RequirementCreator {
    return {
        name,
        workers,
    };
}

function createRequirement({
    name,
    amount,
    creators,
}: {
    name: string;
    amount: number;
    creators: RequirementCreator[];
}): RequirementsResponse {
    return {
        name,
        amount,
        creators,
    };
}

const requirements: RequirementsResponse[] = [
    createRequirement({
        name: "Required Item 1",
        amount: 30,
        creators: [
            createRequirementCreator({ name: "Required Item 1", workers: 20 }),
        ],
    }),
    createRequirement({
        name: "Required Item 2",
        amount: 60,
        creators: [
            createRequirementCreator({ name: "Required Item 2", workers: 40 }),
        ],
    }),
];

const selectedItemName = "Selected Item";
const selectedItem: RequirementsResponse = createRequirement({
    name: selectedItemName,
    amount: 90,
    creators: [
        createRequirementCreator({ name: selectedItemName, workers: 20 }),
    ],
});

const items = [selectedItem, ...requirements];

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
    graphql.query<GetItemRequirementsQuery>(
        expectedRequirementsQueryName,
        (_, res, ctx) => {
            return res(ctx.data({ requirement: [requirements[0]] }));
        }
    ),
    graphql.query(expectedOutputQueryName, (_, res, ctx) => {
        return res(ctx.data({ output: expectedOutput }));
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
        itemName: selectedItemName,
        workers: expectedWorkers,
    });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        name: selectedItemName,
        workers: expectedWorkers,
        maxAvailableTool: "NONE",
    });
});

describe("item w/o requirements handling", async () => {
    beforeEach(() => {
        server.use(
            graphql.query<GetItemRequirementsQuery>(
                expectedRequirementsQueryName,
                (_, res, ctx) => {
                    return res.once(ctx.data({ requirement: [selectedItem] }));
                }
            )
        );
    });

    test("does not render the requirements section header", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
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
            itemName: selectedItemName,
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
            itemName: selectedItemName,
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
            itemName: selectedItemName,
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
            itemName: selectedItemName,
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
            itemName: selectedItemName,
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
                name: expectedAmountColumnName,
            })
        ).toBeVisible();
        expect(
            within(requirementsTable).getByRole("columnheader", {
                name: expectedWorkerColumnName,
            })
        ).toBeVisible();
    });

    describe.each([expectedAmountColumnName, expectedWorkerColumnName])(
        "%s sortable column behavior",
        (columnName: string) => {
            test("renders the column sort button", async () => {
                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });

                const requirementsTable = await screen.findByRole("table");
                expect(
                    within(requirementsTable).getByRole("button", {
                        name: columnName,
                    })
                ).toBeVisible();
            });

            test("sets the column as unsorted (default sort) by default", async () => {
                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });

                const requirementsTable = await screen.findByRole("table");
                const sortableColumnHeader = within(
                    requirementsTable
                ).getByRole("columnheader", { name: columnName });
                expect(sortableColumnHeader).toHaveAttribute(
                    "aria-sort",
                    "none"
                );
            });

            test.each([
                ["once", "descending", 1],
                ["twice", "ascending", 2],
                ["three times", "none", 3],
            ])(
                "pressing the column header %s sets the column sort to %s",
                async (
                    _: string,
                    expectedOrder: string,
                    numberOfClicks: number
                ) => {
                    const user = userEvent.setup();

                    render(<Calculator />, expectedGraphQLAPIURL);
                    await selectItemAndWorkers({
                        itemName: selectedItemName,
                        workers: 5,
                    });
                    const requirementsTable = await screen.findByRole("table");
                    const sortableColumnHeader = within(
                        requirementsTable
                    ).getByRole("columnheader", {
                        name: columnName,
                    });
                    for (let i = 0; i < numberOfClicks; i++) {
                        await act(async () => {
                            await user.click(sortableColumnHeader);
                        });
                    }

                    await waitFor(() =>
                        expect(sortableColumnHeader).toHaveAttribute(
                            "aria-sort",
                            expectedOrder
                        )
                    );
                }
            );
        }
    );

    test("pressing the worker sort resets the amount sort", async () => {
        const user = userEvent.setup();

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
            workers: 5,
        });
        const requirementsTable = await screen.findByRole("table");
        const workersSortableColumnHeader = within(requirementsTable).getByRole(
            "columnheader",
            {
                name: expectedWorkerColumnName,
            }
        );
        const amountSortableColumnHeader = within(requirementsTable).getByRole(
            "columnheader",
            {
                name: expectedAmountColumnName,
            }
        );
        await act(async () => {
            await user.click(amountSortableColumnHeader);
        });
        await waitFor(() =>
            expect(amountSortableColumnHeader).toHaveAttribute(
                "aria-sort",
                "descending"
            )
        );

        await act(async () => {
            await user.click(workersSortableColumnHeader);
        });
        await waitFor(() =>
            expect(workersSortableColumnHeader).toHaveAttribute(
                "aria-sort",
                "descending"
            )
        );
        expect(amountSortableColumnHeader).toHaveAttribute("aria-sort", "none");
    });

    test("pressing the amount sort resets the worker sort", async () => {
        const user = userEvent.setup();

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
            workers: 5,
        });
        const requirementsTable = await screen.findByRole("table");
        const workersSortableColumnHeader = within(requirementsTable).getByRole(
            "columnheader",
            {
                name: expectedWorkerColumnName,
            }
        );
        const amountSortableColumnHeader = within(requirementsTable).getByRole(
            "columnheader",
            {
                name: expectedAmountColumnName,
            }
        );
        await act(async () => {
            await user.click(workersSortableColumnHeader);
        });
        await waitFor(() =>
            expect(workersSortableColumnHeader).toHaveAttribute(
                "aria-sort",
                "descending"
            )
        );

        await act(async () => {
            await user.click(amountSortableColumnHeader);
        });
        await waitFor(() =>
            expect(amountSortableColumnHeader).toHaveAttribute(
                "aria-sort",
                "descending"
            )
        );
        expect(workersSortableColumnHeader).toHaveAttribute(
            "aria-sort",
            "none"
        );
    });

    test("renders the sum total of required workers given requirement with multiple creators", async () => {
        const expectedRequiredItemName = "test requirement";
        const expectedTotal = "12";
        const response: RequirementsResponse[] = [
            selectedItem,
            createRequirement({
                name: expectedRequiredItemName,
                amount: 30,
                creators: [
                    createRequirementCreator({
                        name: expectedRequiredItemName,
                        workers: 5,
                    }),
                    createRequirementCreator({
                        name: "another creator recipe",
                        workers: 7,
                    }),
                ],
            }),
        ];
        server.use(
            graphql.query<GetItemRequirementsQuery>(
                expectedRequirementsQueryName,
                (_, res, ctx) => {
                    return res.once(ctx.data({ requirement: response }));
                }
            )
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
            workers: 5,
        });
        const requirementsTable = await screen.findByRole("table");

        expect(
            within(requirementsTable).getByRole("cell", {
                name: expectedTotal,
            })
        ).toBeVisible();
    });

    test.each([
        [
            "a single requirement",
            [selectedItem, requirements[0]],
            [
                {
                    name: requirements[0].name,
                    amount: requirements[0].amount,
                    workers: requirements[0].creators[0].workers,
                },
            ],
        ],
        [
            "multiple requirements",
            items,
            [
                {
                    name: requirements[0].name,
                    amount: requirements[0].amount,
                    workers: requirements[0].creators[0].workers,
                },
                {
                    name: requirements[1].name,
                    amount: requirements[1].amount,
                    workers: requirements[1].creators[0].workers,
                },
            ],
        ],
    ])(
        "renders each requirement in the table given %s",
        async (
            _: string,
            response: RequirementsResponse[],
            expected: RequirementsTableRow[]
        ) => {
            server.use(
                graphql.query<GetItemRequirementsQuery>(
                    expectedRequirementsQueryName,
                    (_, res, ctx) => {
                        return res.once(ctx.data({ requirement: response }));
                    }
                )
            );

            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
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
                        name: requirement.amount.toString(),
                    })
                );
                expect(
                    within(requirementsTable).getByRole("cell", {
                        name: requirement.workers.toString(),
                    })
                ).toBeVisible();
            }
        }
    );

    test("rounds amount to 1 decimals if more than 1 decimal places", async () => {
        const actualAmount = 3.14;
        const expectedAmount = "≈3.1";
        server.use(
            graphql.query<GetItemRequirementsQuery>(
                expectedRequirementsQueryName,
                (_, res, ctx) => {
                    return res.once(
                        ctx.data({
                            requirement: [
                                createRequirement({
                                    name: "test item name",
                                    amount: actualAmount,
                                    creators: [
                                        createRequirementCreator({
                                            name: "test item name",
                                            workers: 1,
                                        }),
                                    ],
                                }),
                            ],
                        })
                    );
                }
            )
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
            workers: 5,
        });
        const requirementsTable = await screen.findByRole("table");

        expect(
            within(requirementsTable).getByRole("cell", {
                name: expectedAmount,
            })
        ).toBeVisible();
    });

    test("does not show approx symbol if optimal output is only accurate to 1 decimal place", async () => {
        const actualAmount = 3.1;
        server.use(
            graphql.query<GetItemRequirementsQuery>(
                expectedRequirementsQueryName,
                (_, res, ctx) => {
                    return res.once(
                        ctx.data({
                            requirement: [
                                createRequirement({
                                    name: "test item name",
                                    amount: actualAmount,
                                    creators: [
                                        createRequirementCreator({
                                            name: "test item name",
                                            workers: 1,
                                        }),
                                    ],
                                }),
                            ],
                        })
                    );
                }
            )
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
            workers: 5,
        });
        const requirementsTable = await screen.findByRole("table");

        expect(
            within(requirementsTable).getByRole("cell", {
                name: actualAmount.toString(),
            })
        ).toBeVisible();
    });

    test("ceils workers value if the returned value is returned as decimal", async () => {
        const actualWorkers = 3.14;
        const expectedWorkers = "4";
        server.use(
            graphql.query<GetItemRequirementsQuery>(
                expectedRequirementsQueryName,
                (_, res, ctx) => {
                    return res.once(
                        ctx.data({
                            requirement: [
                                createRequirement({
                                    name: "test item name",
                                    amount: 30,
                                    creators: [
                                        createRequirementCreator({
                                            name: "test item name",
                                            workers: actualWorkers,
                                        }),
                                    ],
                                }),
                            ],
                        })
                    );
                }
            )
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
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
                createRequirement({
                    name: "test item 1",
                    amount: 10,
                    creators: [
                        createRequirementCreator({
                            name: "test item 1",
                            workers: 1,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            name: "test item 2",
                            workers: 2,
                        }),
                    ],
                }),
            ],
            [
                { name: "test item 2", amount: 10, workers: 2 },
                { name: "test item 1", amount: 20, workers: 1 },
            ],
            1,
        ],
        [
            "ascending",
            [
                createRequirement({
                    name: "test item 1",
                    amount: 10,
                    creators: [
                        createRequirementCreator({
                            name: "test item 1",
                            workers: 2,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            name: "test item 2",
                            workers: 1,
                        }),
                    ],
                }),
            ],
            [
                { name: "test item 2", amount: 20, workers: 1 },
                { name: "test item 1", amount: 10, workers: 2 },
            ],
            2,
        ],
        [
            "default",
            [
                createRequirement({
                    name: "test item 1",
                    amount: 10,
                    creators: [
                        createRequirementCreator({
                            name: "test item 1",
                            workers: 1,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            name: "test item 2",
                            workers: 2,
                        }),
                    ],
                }),
            ],
            [
                { name: "test item 1", amount: 10, workers: 1 },
                { name: "test item 2", amount: 20, workers: 2 },
            ],
            3,
        ],
    ])(
        "displays the items in %s order by workers if workers column is sorted in that order",
        async (
            _: string,
            unsorted: RequirementsResponse[],
            sorted: RequirementsTableRow[],
            numberOfClicks: number
        ) => {
            server.use(
                graphql.query<GetItemRequirementsQuery>(
                    expectedRequirementsQueryName,
                    (_, res, ctx) => {
                        return res.once(ctx.data({ requirement: unsorted }));
                    }
                )
            );

            const user = userEvent.setup();

            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
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
            itemName: selectedItemName,
            workers: 5,
        });

        expect(await screen.findByRole("alert")).toHaveTextContent(
            expectedErrorMessage
        );
    });

    test("does not render the requirements section header", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
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
            itemName: selectedItemName,
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
