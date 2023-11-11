import {
    queryItemByField,
    queryItemByCreatorCount,
} from "../../adapters/mongodb-query-item";
import { queryItem } from "../query-item";
import { DefaultToolset, GlassesToolset, type Items } from "../../../../types";
import {
    createItem,
    createItemWithGlassesTools,
    createItemWithMachineTools,
} from "../../../../../test";
import { QueryFilters } from "../../interfaces/query-item-primary-port";

jest.mock("../../adapters/mongodb-query-item", () => ({
    queryItemByField: jest.fn(),
    queryItemByCreatorCount: jest.fn(),
}));

const mockQueryItemByField = queryItemByField as jest.Mock;
const mockQueryItemByCreatorCount = queryItemByCreatorCount as jest.Mock;
const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

beforeEach(() => {
    mockQueryItemByField.mockReset();
    mockQueryItemByCreatorCount.mockReset();
    consoleErrorSpy.mockClear();
});

const expectedItemName = "expected item name";
const expectedMinimumCreators = 1;
const expectedCreator = "expected item creator";

describe("field queries", () => {
    test.each([
        [
            "all items",
            "no field filters provided",
            undefined,
            undefined,
            undefined,
        ],
        [
            "a specific item",
            "an item name provided",
            { name: expectedItemName },
            expectedItemName,
            undefined,
        ],
        [
            "a specific creator",
            "a creator provided",
            { creator: expectedCreator },
            undefined,
            expectedCreator,
        ],
    ])(
        "queries the database via fields to fetch %s given %s",
        async (
            _: string,
            __: string,
            filters: QueryFilters | undefined,
            expectedItemName: string | undefined,
            expectedCreator: string | undefined
        ) => {
            await queryItem(filters);

            expect(mockQueryItemByField).toHaveBeenCalledTimes(1);
            expect(mockQueryItemByField).toHaveBeenCalledWith(
                expectedItemName,
                expectedCreator
            );
        }
    );

    test.each([
        ["none received", []],
        [
            "multiple received w/ no farm sizes",
            [
                createItem({
                    name: "test 1",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                }),
                createItem({
                    name: "test 2",
                    createTime: 4,
                    output: 6,
                    requirements: [],
                }),
            ],
        ],
        [
            "multiple received w/ farm sizes",
            [
                createItem({
                    name: "test 1",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    width: 1,
                    height: 2,
                }),
                createItem({
                    name: "test 2",
                    createTime: 4,
                    output: 6,
                    requirements: [],
                    width: 3,
                    height: 4,
                }),
            ],
        ],
    ])(
        "returns all items retrieved by field query given %s (no optimal filter provided)",
        async (_: string, received: Items) => {
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem();

            expect(actual).toHaveLength(received.length);
            expect(actual).toEqual(expect.arrayContaining(received));
        }
    );

    describe("optimal filter handling", () => {
        test("returns only the item with highest output with no tools given multiple recipes for single item (no max tool specified in filter)", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 5,
                requirements: [],
            });
            const received = [
                expected,
                createItem({
                    name: itemName,
                    createTime: 5,
                    output: 2,
                    requirements: [],
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({ optimal: {} });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("returns only the items with highest output given multiple items with multiple recipes (no max tool specified in filter)", async () => {
            const itemName1 = "item 1";
            const itemName2 = "item 2";
            const expected = [
                createItem({
                    name: itemName1,
                    createTime: 1,
                    output: 5,
                    requirements: [],
                }),
                createItem({
                    name: itemName2,
                    createTime: 3,
                    output: 10,
                    requirements: [],
                }),
            ];
            const received = [
                ...expected,
                createItem({
                    name: itemName1,
                    createTime: 5,
                    output: 2,
                    requirements: [],
                }),
                createItem({
                    name: itemName2,
                    createTime: 10,
                    output: 12,
                    requirements: [],
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({ optimal: {} });

            expect(actual).toHaveLength(expected.length);
            expect(actual).toEqual(expect.arrayContaining(expected));
        });

        test("returns item with highest output (due to better possible tool) given multiple recipes and no tool specified", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 5,
                requirements: [],
                maximumTool: DefaultToolset.steel,
            });
            const received = [
                expected,
                createItem({
                    name: itemName,
                    createTime: 1,
                    output: 8,
                    requirements: [],
                    maximumTool: DefaultToolset.copper,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({ optimal: {} });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("returns item with highest output given items that cannot utilize max tool available", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                maximumTool: DefaultToolset.steel,
            });
            const received = [
                expected,
                createItem({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    maximumTool: DefaultToolset.copper,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: { maxAvailableTool: DefaultToolset.steel },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("ignores any item that cannot be created by provided tool even if optimal", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.none,
            });
            const received = [
                expected,
                createItem({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    minimumTool: DefaultToolset.steel,
                    maximumTool: DefaultToolset.steel,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: { maxAvailableTool: DefaultToolset.none },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("ignores any item that requires machine tools if no machine tools are available even if more optimal", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.none,
            });
            const received = [
                expected,
                createItemWithMachineTools({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: { hasMachineTools: false },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test.each([
            ["default behaviour", undefined],
            ["has machine tools", true],
        ])(
            "returns item with machine tools if more optimal (%s)",
            async (_: string, hasMachineTools: boolean | undefined) => {
                const itemName = "item 1";
                const expected = createItemWithMachineTools({
                    name: itemName,
                    createTime: 1,
                    output: 2,
                    requirements: [],
                });
                const received = [
                    expected,
                    createItem({
                        name: itemName,
                        createTime: 1,
                        output: 2,
                        requirements: [],
                    }),
                ];
                mockQueryItemByField.mockResolvedValue(received);

                const actual = await queryItem({
                    optimal: { hasMachineTools },
                });

                expect(actual).toHaveLength(1);
                expect(actual[0]).toEqual(expected);
            }
        );

        test("prefers optimal recipe regardless of whether item has recipe with machine tools", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            });
            const received = [
                expected,
                createItemWithMachineTools({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: {
                    hasMachineTools: true,
                    maxAvailableTool: DefaultToolset.steel,
                },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("returns nothing if only recipe requires machine tools and no machine tools are available", async () => {
            const received = [
                createItemWithMachineTools({
                    name: "test item",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: {
                    hasMachineTools: false,
                },
            });

            expect(actual).toHaveLength(0);
        });

        describe("eye glasses indication", () => {
            test.each([
                ["default indication", undefined],
                ["specified", true],
            ])(
                "returns the recipe that uses eye glasses if more optimal with them (%s)",
                async (_: string, hasEyeglasses: boolean | undefined) => {
                    const itemName = "item 1";
                    const expected = createItemWithGlassesTools({
                        name: itemName,
                        createTime: 1,
                        output: 2,
                        requirements: [],
                        maximumTool: GlassesToolset.glasses,
                    });
                    const received = [
                        expected,
                        createItemWithGlassesTools({
                            name: itemName,
                            createTime: 1,
                            output: 2.2,
                            requirements: [],
                        }),
                    ];
                    mockQueryItemByField.mockResolvedValue(received);

                    const actual = await queryItem({
                        optimal: { hasEyeglasses },
                    });

                    expect(actual).toHaveLength(1);
                    expect(actual[0]).toEqual(expected);
                }
            );

            test("ignores eye glasses availability if the more optimal recipe does not require them", async () => {
                const itemName = "item 1";
                const expected = createItemWithGlassesTools({
                    name: itemName,
                    createTime: 1,
                    output: 10,
                    requirements: [],
                });
                const received = [
                    expected,
                    createItemWithGlassesTools({
                        name: itemName,
                        createTime: 5,
                        output: 10,
                        requirements: [],
                        maximumTool: GlassesToolset.glasses,
                    }),
                ];
                mockQueryItemByField.mockResolvedValue(received);

                const actual = await queryItem({
                    optimal: { hasEyeglasses: true },
                });

                expect(actual).toHaveLength(1);
                expect(actual[0]).toEqual(expected);
            });

            test("does not return more optimal recipe if eye glasses are required but are not available", async () => {
                const itemName = "item 1";
                const expected = createItemWithGlassesTools({
                    name: itemName,
                    createTime: 5,
                    output: 1,
                    requirements: [],
                });
                const received = [
                    expected,
                    createItemWithGlassesTools({
                        name: itemName,
                        createTime: 1,
                        output: 10,
                        requirements: [],
                        minimumTool: GlassesToolset.glasses,
                        maximumTool: GlassesToolset.glasses,
                    }),
                ];
                mockQueryItemByField.mockResolvedValue(received);

                const actual = await queryItem({
                    optimal: { hasEyeglasses: false },
                });

                expect(actual).toHaveLength(1);
                expect(actual[0]).toEqual(expected);
            });
        });
    });

    test("throws an error if an exception occurs while fetching item details by field", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByField.mockRejectedValue(expectedError);

        expect.assertions(1);
        await expect(queryItem()).rejects.toThrow(expectedError);
    });

    test("logs an error message to console if an exception occurs while fetching item details by field", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByField.mockRejectedValue(expectedError);

        try {
            await queryItem();
        } catch {
            // Ignore
        }

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError);
    });
});

describe("creator count queries", () => {
    test.each([
        [
            "a minimum creator count filter is provided",
            { minimumCreators: expectedMinimumCreators },
            expectedMinimumCreators,
            undefined,
        ],
        [
            "a minimum creator count filter is provided w/ an item name",
            {
                minimumCreators: expectedMinimumCreators,
                name: expectedItemName,
            },
            expectedMinimumCreators,
            expectedItemName,
        ],
    ])(
        "queries the database via creator count given %s",
        async (
            _: string,
            filters: QueryFilters | undefined,
            expectedMinimumCreators: number,
            expectedItemName: string | undefined
        ) => {
            await queryItem(filters);

            expect(mockQueryItemByCreatorCount).toHaveBeenCalledTimes(1);
            expect(mockQueryItemByCreatorCount).toHaveBeenCalledWith(
                expectedMinimumCreators,
                expectedItemName
            );
        }
    );

    test.each([
        ["none received", []],
        [
            "multiple received",
            [
                createItem({
                    name: "test 1",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                }),
                createItem({
                    name: "test 1",
                    createTime: 5,
                    output: 7,
                    requirements: [],
                }),
            ],
        ],
    ])(
        "returns all items retrieved given %s",
        async (_: string, received: Items) => {
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({ minimumCreators: 1 });

            expect(actual).toHaveLength(received.length);
            expect(actual).toEqual(expect.arrayContaining(received));
        }
    );

    test("throws an error if an exception occurs while fetching item details", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByCreatorCount.mockRejectedValue(expectedError);

        expect.assertions(1);
        await expect(queryItem({ minimumCreators: 1 })).rejects.toThrow(
            expectedError
        );
    });

    test("logs an error message to console if an exception occurs while fetching item details", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByCreatorCount.mockRejectedValue(expectedError);

        try {
            await queryItem({ minimumCreators: 1 });
        } catch {
            // Ignore
        }

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError);
    });

    describe("optimal filter handling", () => {
        test("returns only the item with highest output with no tools given multiple recipes for single item (no max tool specified in filter)", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 5,
                requirements: [],
            });
            const received = [
                expected,
                createItem({
                    name: itemName,
                    createTime: 5,
                    output: 2,
                    requirements: [],
                }),
            ];
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({
                minimumCreators: 2,
                optimal: {},
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("returns only the items with highest output given multiple items with multiple recipes (no max tool specified in filter)", async () => {
            const itemName1 = "item 1";
            const itemName2 = "item 2";
            const expected = [
                createItem({
                    name: itemName1,
                    createTime: 1,
                    output: 5,
                    requirements: [],
                }),
                createItem({
                    name: itemName2,
                    createTime: 3,
                    output: 10,
                    requirements: [],
                }),
            ];
            const received = [
                ...expected,
                createItem({
                    name: itemName1,
                    createTime: 5,
                    output: 2,
                    requirements: [],
                }),
                createItem({
                    name: itemName2,
                    createTime: 10,
                    output: 12,
                    requirements: [],
                }),
            ];
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({
                minimumCreators: 2,
                optimal: {},
            });

            expect(actual).toHaveLength(expected.length);
            expect(actual).toEqual(expect.arrayContaining(expected));
        });

        test("returns item with highest output (due to better possible tool) given multiple recipes and no tool specified", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 5,
                requirements: [],
                maximumTool: DefaultToolset.steel,
            });
            const received = [
                expected,
                createItem({
                    name: itemName,
                    createTime: 1,
                    output: 8,
                    requirements: [],
                    maximumTool: DefaultToolset.copper,
                }),
            ];
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({
                minimumCreators: 2,
                optimal: {},
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("returns item with highest output given items that cannot utilize max tool available", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                maximumTool: DefaultToolset.steel,
            });
            const received = [
                expected,
                createItem({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    maximumTool: DefaultToolset.copper,
                }),
            ];
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({
                minimumCreators: 2,
                optimal: { maxAvailableTool: DefaultToolset.steel },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("ignores any item that cannot be created by provided tool even if optimal", async () => {
            const itemName = "item 1";
            const expected = createItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.none,
            });
            const received = [
                expected,
                createItem({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    minimumTool: DefaultToolset.steel,
                    maximumTool: DefaultToolset.steel,
                }),
            ];
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({
                minimumCreators: 2,
                optimal: { maxAvailableTool: DefaultToolset.none },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });
    });

    test("throws an error if a minimum creator filter is provided with a creator name filter", async () => {
        const expectedError = new Error(
            "Invalid filter combination provided: Cannot filter by minimum creator and creator name"
        );

        expect.assertions(1);
        await expect(
            queryItem({ minimumCreators: 1, creator: "test creator" })
        ).rejects.toThrow(expectedError);
    });

    test("logs an error message to console if a minimum creator filter is provided with a creator name filter", async () => {
        const expectedError = new Error(
            "Invalid filter combination provided: Cannot filter by minimum creator and creator name"
        );

        try {
            await queryItem({ minimumCreators: 1, creator: "test creator" });
        } catch {
            // Ignore
        }

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
    });
});
