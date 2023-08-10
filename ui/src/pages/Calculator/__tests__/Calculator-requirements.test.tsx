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
    clickButton,
    renderWithTestProviders as render,
    wrapWithTestProviders,
} from "../../../test";
import {
    GetItemRequirementsQuery,
    OutputUnit,
} from "../../../graphql/__generated__/graphql";
import { waitForRequest } from "../../../helpers/utils";
import Calculator from "../Calculator";
import {
    selectItemAndWorkers,
    expectedRequirementsQueryName,
    expectedOutputQueryName,
    expectedItemNameQueryName,
    expectedItemDetailsQueryName,
    expectedCreatorOverrideQueryName,
    selectOutputUnit,
} from "./utils";
import Requirements from "../components/Requirements";
import {
    RequirementsTableRow,
    SingleCreatorRequirementsTableRow,
} from "../components/Requirements/Requirements";

type RequirementsResponse = GetItemRequirementsQuery["requirement"][number];
type RequirementCreator = RequirementsResponse["creators"][number];

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedRequirementsHeading = "Requirements:";
const expectedItemNameColumnName = "Item";
const expectedCreatorColumnName = "Creator";
const expectedAmountColumnName = "Amount";
const expectedWorkerColumnName = "Workers";
const expectedExpandCreatorBreakdownLabel = "Expand creator breakdown";
const expectedCollapseCreatorBreakdownLabel = "Collapse creator breakdown";

function createRequirementCreator({
    recipeName,
    creator = `${recipeName} creator`,
    amount,
    workers,
}: {
    recipeName: string;
    creator?: string;
    amount: number;
    workers: number;
}): RequirementCreator {
    return {
        name: recipeName,
        creator,
        amount,
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

const createRequirementsResponseHandler = (response: RequirementsResponse[]) =>
    graphql.query<GetItemRequirementsQuery>(
        expectedRequirementsQueryName,
        (_, res, ctx) => {
            return res.once(
                ctx.data({
                    requirement: response,
                })
            );
        }
    );

const requirementsWithSingleCreator: RequirementsResponse[] = [
    createRequirement({
        name: "Required Item 1",
        amount: 30,
        creators: [
            createRequirementCreator({
                recipeName: "Required Item 1",
                creator: "Creator 1",
                amount: 30,
                workers: 20,
            }),
        ],
    }),
    createRequirement({
        name: "Required Item 2",
        amount: 60,
        creators: [
            createRequirementCreator({
                recipeName: "Required Item 2",
                amount: 60,
                workers: 40,
            }),
        ],
    }),
];

const requirementWithMultipleCreators = createRequirement({
    name: "Multiple creator item",
    amount: 50,
    creators: [
        createRequirementCreator({
            recipeName: "Multiple creator item",
            creator: "Creator 1",
            amount: 30,
            workers: 12,
        }),
        createRequirementCreator({
            recipeName: "Multiple creator item",
            creator: "Creator 2",
            amount: 20,
            workers: 5,
        }),
    ],
});

const expectedWorkers = 5;
const selectedItemName = "Selected Item";
const selectedItemCreator = "Selected Item Creator";
const selectedItem = createRequirement({
    name: selectedItemName,
    amount: 90,
    creators: [
        createRequirementCreator({
            recipeName: selectedItemName,
            creator: selectedItemCreator,
            amount: 90,
            workers: 20,
        }),
    ],
});

const items = [selectedItem, ...requirementsWithSingleCreator];

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
            return res(
                ctx.data({ requirement: [requirementsWithSingleCreator[0]] })
            );
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

test("queries requirements if item and workers inputted with default unit selected", async () => {
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
        unit: OutputUnit.Minutes,
    });
});

test("queries requirements if item and workers inputted with non-default unit selected", async () => {
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedRequirementsQueryName
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOutputUnit(OutputUnit.GameDays);
    await selectItemAndWorkers({
        itemName: selectedItemName,
        workers: expectedWorkers,
    });
    const { matchedRequestDetails } = await expectedRequest;

    expect(matchedRequestDetails.variables).toEqual({
        name: selectedItemName,
        workers: expectedWorkers,
        unit: OutputUnit.GameDays,
        maxAvailableTool: "NONE",
    });
});

describe("item w/o requirements handling", async () => {
    beforeEach(() => {
        server.use(createRequirementsResponseHandler([selectedItem]));
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
                name: expectedCreatorColumnName,
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
        const expectedTotal = "17";
        server.use(
            createRequirementsResponseHandler([requirementWithMultipleCreators])
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
            [selectedItem, requirementsWithSingleCreator[0]],
            [
                {
                    name: requirementsWithSingleCreator[0].name,
                    creator:
                        requirementsWithSingleCreator[0].creators[0].creator,
                    amount: requirementsWithSingleCreator[0].amount,
                    workers:
                        requirementsWithSingleCreator[0].creators[0].workers,
                },
            ],
        ],
        [
            "multiple requirements",
            items,
            [
                {
                    name: requirementsWithSingleCreator[0].name,
                    creator:
                        requirementsWithSingleCreator[0].creators[0].creator,
                    amount: requirementsWithSingleCreator[0].amount,
                    workers:
                        requirementsWithSingleCreator[0].creators[0].workers,
                },
                {
                    name: requirementsWithSingleCreator[1].name,
                    creator:
                        requirementsWithSingleCreator[1].creators[0].creator,
                    amount: requirementsWithSingleCreator[1].amount,
                    workers:
                        requirementsWithSingleCreator[1].creators[0].workers,
                },
            ],
        ],
    ])(
        "renders each requirement in the table given %s with a single creator",
        async (
            _: string,
            response: RequirementsResponse[],
            expected: SingleCreatorRequirementsTableRow[]
        ) => {
            server.use(createRequirementsResponseHandler(response));

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
                        name: requirement.creator,
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

    test("does not render a expand button to view creator breakdown if item is only created by 1 creator", async () => {
        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: selectedItemName,
            workers: 5,
        });
        const itemCell = await screen.findByRole("cell", {
            name: requirementsWithSingleCreator[0].name,
        });

        expect(
            within(itemCell).queryByRole("button", {
                name: expectedExpandCreatorBreakdownLabel,
            })
        ).not.toBeInTheDocument();
    });

    describe("item with multiple creator rendering", async () => {
        beforeEach(() => {
            server.use(
                createRequirementsResponseHandler([
                    requirementWithMultipleCreators,
                ])
            );
        });

        test.each([
            ["none selected item creators", requirementWithMultipleCreators],
            [
                "selected item creator",
                createRequirement({
                    name: "test item",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            recipeName: selectedItemName,
                            creator: selectedItemCreator,
                            amount: 15,
                            workers: 2,
                        }),
                        createRequirementCreator({
                            recipeName: "test item",
                            amount: 5,
                            workers: 2,
                        }),
                    ],
                }),
            ],
        ])(
            "does not render the creator by default for any item that is created by %s",
            async (_: string, response: RequirementsResponse) => {
                server.use(createRequirementsResponseHandler([response]));

                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const requirementsTable = await screen.findByRole("table");

                for (const creator of response.creators) {
                    expect(
                        within(requirementsTable).queryByRole("cell", {
                            name: creator.creator,
                        })
                    ).not.toBeInTheDocument();
                }
            }
        );

        test("renders a expand button to view creator breakdown", async () => {
            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
                workers: 5,
            });
            const itemCell = await screen.findByRole("cell", {
                name: requirementWithMultipleCreators.name,
            });

            expect(
                within(itemCell).getByRole("button", {
                    name: expectedExpandCreatorBreakdownLabel,
                })
            ).toBeVisible();
        });

        test("pressing the expand button toggles the button to a collapse button", async () => {
            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
                workers: 5,
            });
            const itemCell = await screen.findByRole("cell", {
                name: requirementWithMultipleCreators.name,
            });
            await clickButton({ label: expectedExpandCreatorBreakdownLabel });

            expect(
                await within(itemCell).findByRole("button", {
                    name: expectedCollapseCreatorBreakdownLabel,
                })
            ).toBeVisible();
        });

        test("pressing the collapse button toggles the button back to expand", async () => {
            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
                workers: 5,
            });
            const itemCell = await screen.findByRole("cell", {
                name: requirementWithMultipleCreators.name,
            });
            await clickButton({ label: expectedExpandCreatorBreakdownLabel });
            await clickButton({ label: expectedCollapseCreatorBreakdownLabel });

            expect(
                await within(itemCell).findByRole("button", {
                    name: expectedExpandCreatorBreakdownLabel,
                })
            ).toBeVisible();
        });
    });

    test.each([
        [
            "rounds amount to 1 decimal place if more than 1 decimal places",
            3.13,
            "≈3.1",
        ],
        [
            "does not show approx symbol if amount is only accurate to 1 decimal place",
            3.1,
            "3.1",
        ],
        [
            "rounds amount to more precision if rounding would output zero",
            0.0012,
            "≈0.001",
        ],
        [
            "does not show approx symbol if amount has no additional precision (below 0.1)",
            0.001,
            "0.001",
        ],
        [
            "rounds amount to 1 decimal place (recurring close to ceil)",
            0.8999999999999999,
            "≈0.9",
        ],
    ])("%s", async (_: string, actual: number, expected: string) => {
        server.use(
            graphql.query<GetItemRequirementsQuery>(
                expectedRequirementsQueryName,
                (_, res, ctx) => {
                    return res.once(
                        ctx.data({
                            requirement: [
                                createRequirement({
                                    name: "test item name",
                                    amount: actual,
                                    creators: [
                                        createRequirementCreator({
                                            recipeName: "test item name",
                                            amount: actual,
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
                name: expected,
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
                                            recipeName: "test item name",
                                            amount: 30,
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
                            recipeName: "test item 1",
                            amount: 10,
                            workers: 1,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            recipeName: "test item 2",
                            amount: 20,
                            workers: 2,
                        }),
                    ],
                }),
            ],
            [
                {
                    name: "test item 2",
                    creator: "test item 2 creator",
                    amount: 10,
                    workers: 2,
                },
                {
                    name: "test item 1",
                    creator: "test item 1 creator",
                    amount: 20,
                    workers: 1,
                },
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
                            recipeName: "test item 1",
                            amount: 10,
                            workers: 2,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            recipeName: "test item 2",
                            amount: 20,
                            workers: 1,
                        }),
                    ],
                }),
            ],
            [
                {
                    name: "test item 2",
                    creator: "test item 2 creator",
                    amount: 20,
                    workers: 1,
                },
                {
                    name: "test item 1",
                    creator: "test item 1 creator",
                    amount: 10,
                    workers: 2,
                },
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
                            recipeName: "test item 1",
                            amount: 10,
                            workers: 1,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            recipeName: "test item 2",
                            amount: 20,
                            workers: 2,
                        }),
                    ],
                }),
            ],
            [
                {
                    name: "test item 1",
                    creator: "test item 1 creator",
                    amount: 10,
                    workers: 1,
                },
                {
                    name: "test item 2",
                    creator: "test item 2 creator",
                    amount: 20,
                    workers: 2,
                },
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

    test.each([
        [
            "descending",
            [
                createRequirement({
                    name: "test item 1",
                    amount: 10,
                    creators: [
                        createRequirementCreator({
                            recipeName: "test item 1",
                            amount: 10,
                            workers: 1,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            recipeName: "test item 2",
                            amount: 20,
                            workers: 1,
                        }),
                    ],
                }),
            ],
            [
                {
                    name: "test item 2",
                    creator: "test item 2 creator",
                    amount: 20,
                    workers: 1,
                },
                {
                    name: "test item 1",
                    creator: "test item 1 creator",
                    amount: 10,
                    workers: 1,
                },
            ],
            1,
        ],
        [
            "ascending",
            [
                createRequirement({
                    name: "test item 1",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            recipeName: "test item 1",
                            amount: 20,
                            workers: 1,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 10,
                    creators: [
                        createRequirementCreator({
                            recipeName: "test item 2",
                            amount: 10,
                            workers: 1,
                        }),
                    ],
                }),
            ],
            [
                {
                    name: "test item 2",
                    creator: "test item 2 creator",
                    amount: 10,
                    workers: 1,
                },
                {
                    name: "test item 1",
                    creator: "test item 1 creator",
                    amount: 20,
                    workers: 1,
                },
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
                            recipeName: "test item 1",
                            amount: 10,
                            workers: 1,
                        }),
                    ],
                }),
                createRequirement({
                    name: "test item 2",
                    amount: 20,
                    creators: [
                        createRequirementCreator({
                            recipeName: "test item 2",
                            amount: 20,
                            workers: 1,
                        }),
                    ],
                }),
            ],
            [
                {
                    name: "test item 1",
                    creator: "test item 1 creator",
                    amount: 10,
                    workers: 1,
                },
                {
                    name: "test item 2",
                    creator: "test item 2 creator",
                    amount: 20,
                    workers: 1,
                },
            ],
            3,
        ],
    ])(
        "displays the items in %s order by amount if amount column is sorted in that order",
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
            const amountColumnHeader = within(requirementsTable).getByRole(
                "columnheader",
                { name: expectedAmountColumnName }
            );
            for (let i = 0; i < numberOfClicks; i++) {
                await act(async () => {
                    await user.click(amountColumnHeader);
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
                    within(currentRow).getByText(sorted[i].amount)
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
            { name: expectedItemName, workers: 3, unit: OutputUnit.Minutes }
        );

        const { rerender } = rtlRender(
            wrapWithTestProviders(
                <Requirements
                    selectedItemName={expectedItemName}
                    workers={1}
                    unit={OutputUnit.Minutes}
                />,
                expectedGraphQLAPIURL
            )
        );
        rerender(
            wrapWithTestProviders(
                <Requirements
                    selectedItemName={expectedItemName}
                    workers={2}
                    unit={OutputUnit.Minutes}
                />,
                expectedGraphQLAPIURL
            )
        );
        rerender(
            wrapWithTestProviders(
                <Requirements
                    selectedItemName={expectedItemName}
                    workers={3}
                    unit={OutputUnit.Minutes}
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
