import React from "react";
import { graphql } from "msw";
import { setupServer } from "msw/node";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { clickButton, renderWithTestProviders as render } from "../../../test";
import { Requirement } from "../../../graphql/__generated__/graphql";
import Calculator from "../Calculator";
import {
    selectItemAndWorkers,
    expectedItemNameQueryName,
    expectedItemDetailsQueryName,
    expectedCreatorOverrideQueryName,
    expectedCalculatorOutputQueryName,
    expectedLoadingOutputMessage,
    expectedRequirementsHeading,
    createCreatorDemands,
    createRequirement,
    createRequirementCreator,
} from "./utils";
import { SingleCreatorRequirementsTableRow } from "../components/Output/components/Requirements";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const expectedItemNameColumnName = "Item";
const expectedCreatorColumnName = "Creator";
const expectedDemandedItemColumName = "Demand";
const expectedAmountColumnName = "Amount";
const expectedWorkerColumnName = "Workers";
const expectedExpandCreatorBreakdownLabel = "Expand creator breakdown";
const expectedCollapseCreatorBreakdownLabel = "Collapse creator breakdown";
const expectedExpandDemandBreakdownLabel = "Expand demand breakdown";
const expectedCollapseDemandBreakdownLabel = "Collapse demand breakdown";

enum Columns {
    ITEM_NAME = 0,
    CREATOR = 1,
    DEMANDED_ITEM = 2,
    AMOUNT = 3,
    WORKERS = 4,
}

const requirementsWithSingleCreator = [
    createRequirement({
        name: "Required Item 1",
        amount: 30,
        creators: [
            createRequirementCreator({
                recipeName: "Required Item 1",
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

const requirementWithSingleCreatorAndDemands = createRequirement({
    name: "Single creator item w/ demands",
    amount: 200,
    creators: [
        createRequirementCreator({
            recipeName: "Single creator item w/ demands",
            amount: 200,
            workers: 38,
            demands: [
                createCreatorDemands("Demanded item 1", 25),
                createCreatorDemands("Demanded item 2", 50),
            ],
        }),
    ],
});

const requirementWithMultipleCreators = createRequirement({
    name: "Multiple creator item",
    amount: 50,
    creators: [
        createRequirementCreator({
            recipeName: "Multiple creator item",
            creator: "Multiple creator item creator 1",
            amount: 45,
            workers: 12,
        }),
        createRequirementCreator({
            recipeName: "Multiple creator item",
            creator: "Multiple creator item creator 2",
            amount: 5,
            workers: 2,
        }),
    ],
});

const requirementWithMultipleCreatorsAndDemands = createRequirement({
    name: "Multiple creator item w/ demands",
    amount: 200,
    creators: [
        createRequirementCreator({
            recipeName: "Multiple creator item w/ demands",
            creator: "Multiple creator item w/ demands creator 1",
            amount: 150,
            workers: 29,
            demands: [
                createCreatorDemands("Demanded item 1", 25),
                createCreatorDemands("Demanded item 2", 50),
            ],
        }),
        createRequirementCreator({
            recipeName: "Multiple creator item w/ demands",
            creator: "Multiple creator item w/ demands creator 2",
            amount: 82,
            workers: 9,
        }),
    ],
});

const selectedItemName = "Selected Item";
const selectedItemCreator = "Selected Item Creator";
const selectedItemAmount = 90;
const selectedItemWorkers = 20;

const createRequirements = (requirements: Requirement[]): Requirement[] => {
    const selectedItem = createRequirement({
        name: selectedItemName,
        amount: selectedItemAmount,
        creators: [
            createRequirementCreator({
                recipeName: selectedItemName,
                creator: selectedItemCreator,
                amount: selectedItemAmount,
                workers: selectedItemWorkers,
                demands: requirements.map((requirement) => ({
                    name: requirement.name,
                    amount: requirement.amount,
                })),
            }),
        ],
    });

    return [selectedItem, ...requirements];
};

const items = createRequirements(requirementsWithSingleCreator);

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
    createCalculatorOutputResponseHandler(
        createRequirements([requirementsWithSingleCreator[0]]),
        expectedOutput
    ),
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

describe("item w/o requirements handling", async () => {
    beforeEach(() => {
        server.use(
            createCalculatorOutputResponseHandler(
                createRequirements([]),
                expectedOutput
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
            graphql.query(expectedCalculatorOutputQueryName, (_, res, ctx) => {
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

        expect(
            await screen.findByText(expectedLoadingOutputMessage)
        ).toBeVisible();
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

        expect(
            await screen.findByText(expectedLoadingOutputMessage)
        ).toBeVisible();
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
                name: expectedDemandedItemColumName,
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

    describe("sorting behavior", () => {
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
                        const requirementsTable = await screen.findByRole(
                            "table"
                        );
                        const sortableColumnHeader = within(
                            requirementsTable
                        ).getByRole("columnheader", {
                            name: columnName,
                        });
                        for (let i = 0; i < numberOfClicks; i++) {
                            await user.click(sortableColumnHeader);
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
            const workersSortableColumnHeader = within(
                requirementsTable
            ).getByRole("columnheader", {
                name: expectedWorkerColumnName,
            });
            const amountSortableColumnHeader = within(
                requirementsTable
            ).getByRole("columnheader", {
                name: expectedAmountColumnName,
            });
            await user.click(amountSortableColumnHeader);
            await waitFor(() =>
                expect(amountSortableColumnHeader).toHaveAttribute(
                    "aria-sort",
                    "descending"
                )
            );

            await user.click(workersSortableColumnHeader);
            await waitFor(() =>
                expect(workersSortableColumnHeader).toHaveAttribute(
                    "aria-sort",
                    "descending"
                )
            );
            expect(amountSortableColumnHeader).toHaveAttribute(
                "aria-sort",
                "none"
            );
        });

        test("pressing the amount sort resets the worker sort", async () => {
            const user = userEvent.setup();

            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
                workers: 5,
            });
            const requirementsTable = await screen.findByRole("table");
            const workersSortableColumnHeader = within(
                requirementsTable
            ).getByRole("columnheader", {
                name: expectedWorkerColumnName,
            });
            const amountSortableColumnHeader = within(
                requirementsTable
            ).getByRole("columnheader", {
                name: expectedAmountColumnName,
            });
            await user.click(workersSortableColumnHeader);
            await waitFor(() =>
                expect(workersSortableColumnHeader).toHaveAttribute(
                    "aria-sort",
                    "descending"
                )
            );

            await user.click(amountSortableColumnHeader);
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
    });

    describe("requirement with single creator rendering", () => {
        test.each([
            [
                "a single requirement",
                createRequirements([requirementsWithSingleCreator[0]]),
                [
                    {
                        name: selectedItemName,
                        creator: selectedItemCreator,
                        amount: selectedItemAmount,
                        workers: selectedItemWorkers,
                    },
                    {
                        name: requirementsWithSingleCreator[0].name,
                        creator:
                            requirementsWithSingleCreator[0].creators[0]
                                .creator,
                        amount: requirementsWithSingleCreator[0].amount,
                        workers:
                            requirementsWithSingleCreator[0].creators[0]
                                .workers,
                    },
                ],
            ],
            [
                "multiple requirements",
                items,
                [
                    {
                        name: selectedItemName,
                        creator: selectedItemCreator,
                        amount: selectedItemAmount,
                        workers: selectedItemWorkers,
                    },
                    {
                        name: requirementsWithSingleCreator[0].name,
                        creator:
                            requirementsWithSingleCreator[0].creators[0]
                                .creator,
                        amount: requirementsWithSingleCreator[0].amount,
                        workers:
                            requirementsWithSingleCreator[0].creators[0]
                                .workers,
                    },
                    {
                        name: requirementsWithSingleCreator[1].name,
                        creator:
                            requirementsWithSingleCreator[1].creators[0]
                                .creator,
                        amount: requirementsWithSingleCreator[1].amount,
                        workers:
                            requirementsWithSingleCreator[1].creators[0]
                                .workers,
                    },
                ],
            ],
        ])(
            "renders each requirement in the table given %s with a single creator",
            async (
                _: string,
                response: Requirement[],
                expected: Omit<
                    SingleCreatorRequirementsTableRow,
                    "key" | "isExpanded" | "type" | "demands"
                >[]
            ) => {
                server.use(
                    createCalculatorOutputResponseHandler(
                        response,
                        expectedOutput
                    )
                );

                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const requirementsTable = await screen.findByRole("table");
                const rows = within(requirementsTable).getAllByRole("row");

                expect(rows).toHaveLength(expected.length + 1);
                for (const requirement of expected) {
                    const requirementCell = within(requirementsTable).getByRole(
                        "cell",
                        { name: requirement.name }
                    );
                    const requirementRow =
                        requirementCell.parentElement as HTMLElement;

                    expect(requirementCell).toBeVisible();
                    const cells = within(requirementRow).getAllByRole("cell");

                    expect(cells).toHaveLength(5);
                    expect(cells[Columns.CREATOR]).toHaveAccessibleName(
                        requirement.creator
                    );
                    expect(cells[Columns.CREATOR]).toBeVisible();
                    expect(cells[Columns.DEMANDED_ITEM]).toHaveAccessibleName(
                        ""
                    );
                    expect(cells[Columns.DEMANDED_ITEM]).toBeVisible();
                    expect(cells[Columns.AMOUNT]).toHaveAccessibleName(
                        requirement.amount.toString()
                    );
                    expect(cells[Columns.AMOUNT]).toBeVisible();
                    expect(cells[Columns.WORKERS]).toHaveAccessibleName(
                        requirement.workers.toString()
                    );
                    expect(cells[Columns.WORKERS]).toBeVisible();
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

        test("does not render a expand button to view demand breakdown if item has no demands", async () => {
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
                    name: expectedExpandDemandBreakdownLabel,
                })
            ).not.toBeInTheDocument();
        });

        describe("demand rendering", () => {
            const requirements = [
                requirementWithSingleCreatorAndDemands,
                ...requirementsWithSingleCreator,
            ];

            beforeEach(() => {
                server.use(
                    createCalculatorOutputResponseHandler(
                        requirements,
                        expectedOutput
                    )
                );
            });

            test("renders an expand button to view demand breakdown if item has demands", async () => {
                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const itemCell = await screen.findByRole("cell", {
                    name: requirementWithSingleCreatorAndDemands.name,
                });

                expect(
                    within(itemCell).getByRole("button", {
                        name: expectedExpandDemandBreakdownLabel,
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
                    name: requirementWithSingleCreatorAndDemands.name,
                });
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                    inside: itemCell,
                });

                expect(
                    await within(itemCell).findByRole("button", {
                        name: expectedCollapseDemandBreakdownLabel,
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
                    name: requirementWithSingleCreatorAndDemands.name,
                });
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                    inside: itemCell,
                });
                await clickButton({
                    label: expectedCollapseDemandBreakdownLabel,
                    inside: itemCell,
                });

                expect(
                    await within(itemCell).findByRole("button", {
                        name: expectedExpandDemandBreakdownLabel,
                    })
                ).toBeVisible();
            });

            test("can toggle expansion even if rows sorted", async () => {
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
                await user.click(amountColumnHeader);
                const itemCell = await screen.findByRole("cell", {
                    name: requirementWithSingleCreatorAndDemands.name,
                });

                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                    inside: itemCell,
                });

                expect(
                    await within(itemCell).findByRole("button", {
                        name: expectedCollapseDemandBreakdownLabel,
                    })
                ).toBeVisible();
                await clickButton({
                    label: expectedCollapseDemandBreakdownLabel,
                    inside: itemCell,
                });
                expect(
                    await within(itemCell).findByRole("button", {
                        name: expectedExpandDemandBreakdownLabel,
                    })
                ).toBeVisible();
            });

            test("does not show demand breakdown by default", async () => {
                const demands =
                    requirementWithSingleCreatorAndDemands.creators[0].demands;

                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const requirementsTable = await screen.findByRole("table");
                const rows = within(requirementsTable).getAllByRole("row");

                expect(rows).toHaveLength(requirements.length + 1);
                for (const demand of demands) {
                    expect(
                        within(requirementsTable).queryByRole("cell", {
                            name: demand.name,
                        })
                    ).not.toBeInTheDocument();
                    expect(
                        within(requirementsTable).queryByRole("cell", {
                            name: demand.amount.toString(),
                        })
                    ).not.toBeInTheDocument();
                }
            });

            test("expanding the demand breakdown shows demanded item name and amount", async () => {
                const demands =
                    requirementWithSingleCreatorAndDemands.creators[0].demands;

                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const requirementsTable = await screen.findByRole("table");
                const itemCell = await screen.findByRole("cell", {
                    name: requirementWithSingleCreatorAndDemands.name,
                });
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                    inside: itemCell,
                });
                const rows = within(requirementsTable).getAllByRole("row");

                expect(rows).toHaveLength(
                    demands.length + requirements.length + 1
                );
                for (let i = 0; i < demands.length; i++) {
                    const cells = within(rows[i + demands.length]).getAllByRole(
                        "cell"
                    );

                    expect(cells).toHaveLength(5);
                    expect(cells[Columns.DEMANDED_ITEM]).toHaveAccessibleName(
                        demands[i].name
                    );
                    expect(cells[Columns.DEMANDED_ITEM]).toBeVisible();
                    expect(cells[Columns.AMOUNT]).toHaveAccessibleName(
                        demands[i].amount.toString()
                    );
                    expect(cells[Columns.AMOUNT]).toBeVisible();
                }
            });
        });
    });

    describe("item with multiple creators rendering", async () => {
        const requirements = [
            requirementWithMultipleCreators,
            ...requirementsWithSingleCreator,
        ];

        beforeEach(() => {
            server.use(
                createCalculatorOutputResponseHandler(
                    requirements,
                    expectedOutput
                )
            );
        });

        test("renders the sum total of required workers given requirement with multiple creators", async () => {
            const expectedTotal = "14";

            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
                workers: 5,
            });
            const requirementsTable = await screen.findByRole("table");
            const requirementCell = within(requirementsTable).getByRole(
                "cell",
                { name: requirementWithMultipleCreators.name }
            );
            const requirementRow = requirementCell.parentElement as HTMLElement;
            const cells = within(requirementRow).getAllByRole("cell");

            expect(cells[Columns.WORKERS]).toHaveAccessibleName(expectedTotal);
            expect(cells[Columns.WORKERS]).toBeVisible();
        });

        test.each([
            ["non-selected item creator", requirementWithMultipleCreators],
        ])(
            "does not render the creator by default for any item that is created by %s",
            async (_: string, response: Requirement) => {
                server.use(
                    createCalculatorOutputResponseHandler(
                        createRequirements([response]),
                        expectedOutput
                    )
                );

                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const requirementsTable = await screen.findByRole("table");
                const requirementCell = within(requirementsTable).getByRole(
                    "cell",
                    { name: response.name }
                );
                const requirementRow =
                    requirementCell.parentElement as HTMLElement;
                const cells = within(requirementRow).getAllByRole("cell");

                expect(cells[Columns.CREATOR]).toHaveAccessibleName("");
                expect(cells[Columns.CREATOR]).toBeVisible();
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

        test("can toggle creator expansion even if rows sorted", async () => {
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
            await user.click(workersColumnHeader);
            const itemCell = await screen.findByRole("cell", {
                name: requirementWithMultipleCreators.name,
            });
            await clickButton({
                label: expectedExpandCreatorBreakdownLabel,
                inside: itemCell,
            });

            expect(
                await within(itemCell).findByRole("button", {
                    name: expectedCollapseCreatorBreakdownLabel,
                })
            ).toBeVisible();
            await clickButton({
                label: expectedCollapseCreatorBreakdownLabel,
                inside: itemCell,
            });
            expect(
                await within(itemCell).findByRole("button", {
                    name: expectedExpandCreatorBreakdownLabel,
                })
            ).toBeVisible();
        });

        test("does not show creator breakdown by default", async () => {
            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
                workers: 5,
            });
            const requirementsTable = await screen.findByRole("table");
            const rows = within(requirementsTable).getAllByRole("row");

            expect(rows).toHaveLength(requirements.length + 1);
            for (const creator of requirementWithMultipleCreators.creators) {
                expect(
                    within(requirementsTable).queryByRole("cell", {
                        name: creator.creator,
                    })
                ).not.toBeInTheDocument();
                expect(
                    within(requirementsTable).queryByRole("cell", {
                        name: creator.amount.toString(),
                    })
                ).not.toBeInTheDocument();
                expect(
                    within(requirementsTable).queryByRole("cell", {
                        name: creator.workers.toString(),
                    })
                ).not.toBeInTheDocument();
            }
        });

        test("expanding the creator breakdown shows item creation amount and worker requirements for each creator", async () => {
            const expectedCreators = requirementWithMultipleCreators.creators;

            render(<Calculator />, expectedGraphQLAPIURL);
            await selectItemAndWorkers({
                itemName: selectedItemName,
                workers: 5,
            });
            const requirementsTable = await screen.findByRole("table");
            await clickButton({ label: expectedExpandCreatorBreakdownLabel });
            const rows = within(requirementsTable).getAllByRole("row");

            expect(rows).toHaveLength(
                expectedCreators.length + requirements.length + 1
            );

            for (let i = 0; i < expectedCreators.length; i++) {
                const cells = within(
                    rows[i + expectedCreators.length]
                ).getAllByRole("cell");

                expect(cells).toHaveLength(5);
                expect(cells[Columns.CREATOR]).toHaveAccessibleName(
                    expectedCreators[i].creator
                );
                expect(cells[Columns.CREATOR]).toBeVisible();
                expect(cells[Columns.AMOUNT]).toHaveAccessibleName(
                    expectedCreators[i].amount.toString()
                );
                expect(cells[Columns.AMOUNT]).toBeVisible();
                expect(cells[Columns.WORKERS]).toHaveAccessibleName(
                    expectedCreators[i].workers.toString()
                );
                expect(cells[Columns.WORKERS]).toBeVisible();
            }
        });

        describe("demand rendering", () => {
            const requirements = [requirementWithMultipleCreatorsAndDemands];
            const expectedCreatorWithDemands =
                requirementWithMultipleCreatorsAndDemands.creators[0].creator;

            beforeEach(() => {
                server.use(
                    createCalculatorOutputResponseHandler(
                        createRequirements(requirements),
                        expectedOutput
                    )
                );
            });

            test("renders an expand button to view demand breakdown if creator has demands", async () => {
                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const itemCell = await screen.findByRole("cell", {
                    name: requirementWithMultipleCreatorsAndDemands.name,
                });
                await clickButton({
                    label: expectedExpandCreatorBreakdownLabel,
                    inside: itemCell,
                });
                const creatorCell = await screen.findByRole("cell", {
                    name: expectedCreatorWithDemands,
                });

                expect(
                    within(creatorCell).getByRole("button", {
                        name: expectedExpandDemandBreakdownLabel,
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
                    name: requirementWithMultipleCreatorsAndDemands.name,
                });
                await clickButton({
                    label: expectedExpandCreatorBreakdownLabel,
                    inside: itemCell,
                });
                const creatorCell = await screen.findByRole("cell", {
                    name: expectedCreatorWithDemands,
                });
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                    inside: creatorCell,
                });

                expect(
                    within(creatorCell).getByRole("button", {
                        name: expectedCollapseDemandBreakdownLabel,
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
                    name: requirementWithMultipleCreatorsAndDemands.name,
                });
                await clickButton({
                    label: expectedExpandCreatorBreakdownLabel,
                    inside: itemCell,
                });
                const creatorCell = await screen.findByRole("cell", {
                    name: expectedCreatorWithDemands,
                });
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                    inside: creatorCell,
                });
                await clickButton({
                    label: expectedCollapseDemandBreakdownLabel,
                    inside: creatorCell,
                });

                expect(
                    await within(creatorCell).findByRole("button", {
                        name: expectedExpandDemandBreakdownLabel,
                    })
                ).toBeVisible();
            });

            test("can toggle expansion even if rows sorted", async () => {
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
                await user.click(amountColumnHeader);
                const itemCell = await screen.findByRole("cell", {
                    name: requirementWithMultipleCreatorsAndDemands.name,
                });
                await clickButton({
                    label: expectedExpandCreatorBreakdownLabel,
                    inside: itemCell,
                });
                const creatorCell = await screen.findByRole("cell", {
                    name: expectedCreatorWithDemands,
                });
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                    inside: creatorCell,
                });
                await clickButton({
                    label: expectedCollapseDemandBreakdownLabel,
                    inside: creatorCell,
                });

                expect(
                    await within(creatorCell).findByRole("button", {
                        name: expectedExpandDemandBreakdownLabel,
                    })
                ).toBeVisible();
            });

            test("does not show demand breakdown by default", async () => {
                const demands =
                    requirementWithMultipleCreatorsAndDemands.creators.flatMap(
                        (creator) => creator.demands
                    );

                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const requirementsTable = await screen.findByRole("table");
                const rows = within(requirementsTable).getAllByRole("row");

                expect(rows).toHaveLength(requirements.length + 2);
                for (const demand of demands) {
                    expect(
                        within(requirementsTable).queryByRole("cell", {
                            name: demand.name,
                        })
                    ).not.toBeInTheDocument();
                    expect(
                        within(requirementsTable).queryByRole("cell", {
                            name: demand.amount.toString(),
                        })
                    ).not.toBeInTheDocument();
                }
            });

            test("expanding the demand breakdown shows demanded item name and amount", async () => {
                const demands =
                    requirementWithMultipleCreatorsAndDemands.creators[0]
                        .demands;
                const expectedOffset =
                    requirementWithMultipleCreatorsAndDemands.creators.length +
                    demands.length +
                    1;

                render(<Calculator />, expectedGraphQLAPIURL);
                await selectItemAndWorkers({
                    itemName: selectedItemName,
                    workers: 5,
                });
                const requirementsTable = await screen.findByRole("table");
                const itemCell = await screen.findByRole("cell", {
                    name: requirementWithMultipleCreatorsAndDemands.name,
                });
                await clickButton({
                    label: expectedExpandCreatorBreakdownLabel,
                    inside: itemCell,
                });
                const creatorCell = await screen.findByRole("cell", {
                    name: expectedCreatorWithDemands,
                });
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                    inside: creatorCell,
                });
                const rows = within(requirementsTable).getAllByRole("row");

                expect(rows).toHaveLength(
                    expectedOffset + requirements.length + 1
                );
                for (let i = 0; i < demands.length; i++) {
                    const cells = within(
                        rows[i + expectedOffset - 1]
                    ).getAllByRole("cell");

                    expect(cells).toHaveLength(5);
                    expect(cells[Columns.DEMANDED_ITEM]).toHaveAccessibleName(
                        demands[i].name
                    );
                    expect(cells[Columns.DEMANDED_ITEM]).toBeVisible();
                    expect(cells[Columns.AMOUNT]).toHaveAccessibleName(
                        demands[i].amount.toString()
                    );
                    expect(cells[Columns.AMOUNT]).toBeVisible();
                }
            });
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
            createCalculatorOutputResponseHandler(
                createRequirements([
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
                ]),
                expectedOutput
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
            createCalculatorOutputResponseHandler(
                createRequirements([
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
                ]),
                expectedOutput
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

    describe("handles sorting", () => {
        test.each([
            [
                "descending",
                [
                    createRequirement({
                        name: "Test item 1",
                        amount: 25,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 1",
                                amount: 20,
                                workers: 10,
                                demands: [
                                    createCreatorDemands("Test item 2", 45),
                                    createCreatorDemands("Test item 3", 20),
                                ],
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 2",
                        amount: 45,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 20,
                                workers: 10,
                                demands: [],
                                creator: "Test item 2 - Creator 2",
                            }),
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 25,
                                workers: 15,
                                demands: [],
                                creator: "Test item 2 - Creator 1",
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 3",
                        amount: 20,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 3",
                                amount: 20,
                                workers: 10,
                                demands: [],
                            }),
                        ],
                    }),
                ],
                [
                    {
                        name: "Test item 2",
                        creator: "",
                        demand: "",
                        amount: 45,
                        workers: "25",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 1",
                        demand: "",
                        amount: 25,
                        workers: "15",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 2",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                    {
                        name: "Test item 1",
                        creator: "Test item 1 creator",
                        demand: "",
                        amount: 25,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 2",
                        amount: 45,
                        workers: "",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 3",
                        amount: 20,
                        workers: "",
                    },
                    {
                        name: "Test item 3",
                        creator: "Test item 3 creator",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                ],
                1,
            ],
            [
                "ascending",
                [
                    createRequirement({
                        name: "Test item 1",
                        amount: 25,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 1",
                                amount: 20,
                                workers: 10,
                                demands: [
                                    createCreatorDemands("Test item 2", 45),
                                    createCreatorDemands("Test item 3", 20),
                                ],
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 2",
                        amount: 45,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 20,
                                workers: 10,
                                demands: [],
                                creator: "Test item 2 - Creator 2",
                            }),
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 25,
                                workers: 15,
                                demands: [],
                                creator: "Test item 2 - Creator 1",
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 3",
                        amount: 20,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 3",
                                amount: 20,
                                workers: 10,
                                demands: [],
                            }),
                        ],
                    }),
                ],
                [
                    {
                        name: "Test item 1",
                        creator: "Test item 1 creator",
                        demand: "",
                        amount: 25,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 2",
                        amount: 45,
                        workers: "",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 3",
                        amount: 20,
                        workers: "",
                    },
                    {
                        name: "Test item 3",
                        creator: "Test item 3 creator",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                    {
                        name: "Test item 2",
                        creator: "",
                        demand: "",
                        amount: 45,
                        workers: "25",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 2",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 1",
                        demand: "",
                        amount: 25,
                        workers: "15",
                    },
                ],
                2,
            ],
            [
                "default",
                [
                    createRequirement({
                        name: "Test item 1",
                        amount: 25,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 1",
                                amount: 20,
                                workers: 10,
                                demands: [
                                    createCreatorDemands("Test item 2", 45),
                                    createCreatorDemands("Test item 3", 20),
                                ],
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 2",
                        amount: 45,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 20,
                                workers: 10,
                                demands: [],
                                creator: "Test item 2 - Creator 2",
                            }),
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 25,
                                workers: 15,
                                demands: [],
                                creator: "Test item 2 - Creator 1",
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 3",
                        amount: 20,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 3",
                                amount: 20,
                                workers: 10,
                                demands: [],
                            }),
                        ],
                    }),
                ],
                [
                    {
                        name: "Test item 1",
                        creator: "Test item 1 creator",
                        demand: "",
                        amount: 25,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 2",
                        amount: 45,
                        workers: "",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 3",
                        amount: 20,
                        workers: "",
                    },
                    {
                        name: "Test item 2",
                        creator: "",
                        demand: "",
                        amount: 45,
                        workers: "25",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 2",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 1",
                        demand: "",
                        amount: 25,
                        workers: "15",
                    },
                    {
                        name: "Test item 3",
                        creator: "Test item 3 creator",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                ],
                3,
            ],
        ])(
            "sorts rows and breakdowns in %s order if workers column is sorted in that order",
            async (
                _: string,
                unsorted: Requirement[],
                expected: {
                    name: string;
                    creator: string;
                    demand: string;
                    amount: number;
                    workers: string;
                }[],
                numberOfClicks: number
            ) => {
                server.use(
                    createCalculatorOutputResponseHandler(
                        unsorted,
                        expectedOutput
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
                    {
                        name: expectedWorkerColumnName,
                    }
                );
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                });
                await clickButton({
                    label: expectedExpandCreatorBreakdownLabel,
                });
                for (let i = 0; i < numberOfClicks; i++) {
                    await user.click(workersColumnHeader);
                }

                const rows = within(requirementsTable).getAllByRole("row");
                for (let i = 0; i < expected.length; i++) {
                    const row = expected[i];
                    const cells = within(rows[i + 1]).getAllByRole("cell");

                    expect(cells[Columns.ITEM_NAME]).toHaveAccessibleName(
                        row.name
                    );
                    expect(cells[Columns.ITEM_NAME]).toBeVisible();
                    expect(cells[Columns.CREATOR]).toHaveAccessibleName(
                        row.creator
                    );
                    expect(cells[Columns.CREATOR]).toBeVisible();
                    expect(cells[Columns.DEMANDED_ITEM]).toHaveAccessibleName(
                        row.demand
                    );
                    expect(cells[Columns.DEMANDED_ITEM]).toBeVisible();
                    expect(cells[Columns.AMOUNT]).toHaveAccessibleName(
                        row.amount.toString()
                    );
                    expect(cells[Columns.AMOUNT]).toBeVisible();
                    expect(cells[Columns.WORKERS]).toHaveAccessibleName(
                        row.workers
                    );
                    expect(cells[Columns.WORKERS]).toBeVisible();
                }
            }
        );

        test.each([
            [
                "descending",
                [
                    createRequirement({
                        name: "Test item 1",
                        amount: 25,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 1",
                                amount: 20,
                                workers: 10,
                                demands: [
                                    createCreatorDemands("Test item 2", 45),
                                    createCreatorDemands("Test item 3", 20),
                                ],
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 2",
                        amount: 45,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 20,
                                workers: 10,
                                demands: [],
                                creator: "Test item 2 - Creator 2",
                            }),
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 25,
                                workers: 15,
                                demands: [],
                                creator: "Test item 2 - Creator 1",
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 3",
                        amount: 20,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 3",
                                amount: 20,
                                workers: 10,
                                demands: [],
                            }),
                        ],
                    }),
                ],
                [
                    {
                        name: "Test item 2",
                        creator: "",
                        demand: "",
                        amount: 45,
                        workers: "25",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 1",
                        demand: "",
                        amount: 25,
                        workers: "15",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 2",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                    {
                        name: "Test item 1",
                        creator: "Test item 1 creator",
                        demand: "",
                        amount: 25,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 2",
                        amount: 45,
                        workers: "",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 3",
                        amount: 20,
                        workers: "",
                    },
                    {
                        name: "Test item 3",
                        creator: "Test item 3 creator",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                ],
                1,
            ],
            [
                "ascending",
                [
                    createRequirement({
                        name: "Test item 1",
                        amount: 25,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 1",
                                amount: 20,
                                workers: 10,
                                demands: [
                                    createCreatorDemands("Test item 2", 45),
                                    createCreatorDemands("Test item 3", 20),
                                ],
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 2",
                        amount: 45,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 20,
                                workers: 10,
                                demands: [],
                                creator: "Test item 2 - Creator 2",
                            }),
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 25,
                                workers: 15,
                                demands: [],
                                creator: "Test item 2 - Creator 1",
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 3",
                        amount: 20,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 3",
                                amount: 20,
                                workers: 10,
                                demands: [],
                            }),
                        ],
                    }),
                ],
                [
                    {
                        name: "Test item 3",
                        creator: "Test item 3 creator",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                    {
                        name: "Test item 1",
                        creator: "Test item 1 creator",
                        demand: "",
                        amount: 25,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 3",
                        amount: 20,
                        workers: "",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 2",
                        amount: 45,
                        workers: "",
                    },
                    {
                        name: "Test item 2",
                        creator: "",
                        demand: "",
                        amount: 45,
                        workers: "25",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 2",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 1",
                        demand: "",
                        amount: 25,
                        workers: "15",
                    },
                ],
                2,
            ],
            [
                "default",
                [
                    createRequirement({
                        name: "Test item 1",
                        amount: 25,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 1",
                                amount: 20,
                                workers: 10,
                                demands: [
                                    createCreatorDemands("Test item 2", 45),
                                    createCreatorDemands("Test item 3", 20),
                                ],
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 2",
                        amount: 45,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 20,
                                workers: 10,
                                demands: [],
                                creator: "Test item 2 - Creator 2",
                            }),
                            createRequirementCreator({
                                recipeName: "Test item 2",
                                amount: 25,
                                workers: 15,
                                demands: [],
                                creator: "Test item 2 - Creator 1",
                            }),
                        ],
                    }),
                    createRequirement({
                        name: "Test item 3",
                        amount: 20,
                        creators: [
                            createRequirementCreator({
                                recipeName: "Test item 3",
                                amount: 20,
                                workers: 10,
                                demands: [],
                            }),
                        ],
                    }),
                ],
                [
                    {
                        name: "Test item 1",
                        creator: "Test item 1 creator",
                        demand: "",
                        amount: 25,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 2",
                        amount: 45,
                        workers: "",
                    },
                    {
                        name: "",
                        creator: "",
                        demand: "Test item 3",
                        amount: 20,
                        workers: "",
                    },
                    {
                        name: "Test item 2",
                        creator: "",
                        demand: "",
                        amount: 45,
                        workers: "25",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 2",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                    {
                        name: "",
                        creator: "Test item 2 - Creator 1",
                        demand: "",
                        amount: 25,
                        workers: "15",
                    },
                    {
                        name: "Test item 3",
                        creator: "Test item 3 creator",
                        demand: "",
                        amount: 20,
                        workers: "10",
                    },
                ],
                3,
            ],
        ])(
            "sorts rows and breakdowns in %s order if amount column is sorted in that order",
            async (
                _: string,
                unsorted: Requirement[],
                expected: {
                    name: string;
                    creator: string;
                    demand: string;
                    amount: number;
                    workers: string;
                }[],
                numberOfClicks: number
            ) => {
                server.use(
                    createCalculatorOutputResponseHandler(
                        unsorted,
                        expectedOutput
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
                    {
                        name: expectedAmountColumnName,
                    }
                );
                await clickButton({
                    label: expectedExpandDemandBreakdownLabel,
                });
                await clickButton({
                    label: expectedExpandCreatorBreakdownLabel,
                });
                for (let i = 0; i < numberOfClicks; i++) {
                    await user.click(amountColumnHeader);
                }

                const rows = within(requirementsTable).getAllByRole("row");
                for (let i = 0; i < expected.length; i++) {
                    const row = expected[i];
                    const cells = within(rows[i + 1]).getAllByRole("cell");

                    expect(cells[Columns.ITEM_NAME]).toHaveAccessibleName(
                        row.name
                    );
                    expect(cells[Columns.ITEM_NAME]).toBeVisible();
                    expect(cells[Columns.CREATOR]).toHaveAccessibleName(
                        row.creator
                    );
                    expect(cells[Columns.CREATOR]).toBeVisible();
                    expect(cells[Columns.DEMANDED_ITEM]).toHaveAccessibleName(
                        row.demand
                    );
                    expect(cells[Columns.DEMANDED_ITEM]).toBeVisible();
                    expect(cells[Columns.AMOUNT]).toHaveAccessibleName(
                        row.amount.toString()
                    );
                    expect(cells[Columns.AMOUNT]).toBeVisible();
                    expect(cells[Columns.WORKERS]).toHaveAccessibleName(
                        row.workers
                    );
                    expect(cells[Columns.WORKERS]).toBeVisible();
                }
            }
        );
    });
});

afterAll(() => {
    server.close();
});
