import { vi, Mock } from "vitest";

import {
    queryItemByField,
    queryItemByCreatorCount,
} from "../../adapters/mongodb-query-item";
import { queryItem } from "../query-item";
import {
    DefaultToolset,
    EyeglassesToolset,
    TranslatedItem,
} from "../../../../types";
import {
    createTranslatedItem,
    createTranslatedItemWithEyeglasses,
    createTranslatedItemWithMachineTools,
} from "../../../../../test";
import { QueryFilters } from "../../interfaces/query-item-primary-port";

vi.mock("../../adapters/mongodb-query-item", () => ({
    queryItemByField: vi.fn(),
    queryItemByCreatorCount: vi.fn(),
}));

const mockQueryItemByField = queryItemByField as Mock;
const mockQueryItemByCreatorCount = queryItemByCreatorCount as Mock;
const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

beforeEach(() => {
    mockQueryItemByField.mockReset();
    mockQueryItemByCreatorCount.mockReset();
    consoleErrorSpy.mockClear();
});

const expectedItemID = "expected item ID";
const expectedMinimumCreators = 1;
const expectedCreatorID = "expected item creator ID";

describe("field queries", () => {
    test.each([
        [
            "all items",
            "no field filters provided (default locale)",
            undefined,
            undefined,
            "en-US",
            undefined,
            undefined,
        ],
        [
            "all items",
            "no field filters provided (specific locale)",
            undefined,
            "fr-FR",
            "fr-FR",
            undefined,
            undefined,
        ],
        [
            "a specific item",
            "an item ID provided (default locale)",
            { id: expectedItemID },
            undefined,
            "en-US",
            expectedItemID,
            undefined,
        ],
        [
            "a specific item",
            "an item ID provided (specific locale)",
            { id: expectedItemID },
            "fr-FR",
            "fr-FR",
            expectedItemID,
            undefined,
        ],
        [
            "a specific creator",
            "a creator ID provided (default locale)",
            { creatorID: expectedCreatorID },
            undefined,
            "en-US",
            undefined,
            expectedCreatorID,
        ],
        [
            "a specific creator",
            "a creator ID provided (specific locale)",
            { creatorID: expectedCreatorID },
            "fr-FR",
            "fr-FR",
            undefined,
            expectedCreatorID,
        ],
    ])(
        "queries the database via fields to fetch %s given %s",
        async (
            _: string,
            __: string,
            filters: QueryFilters | undefined,
            locale: string | undefined,
            expectedLocale: string,
            expectedItemID: string | undefined,
            expectedCreatorID: string | undefined,
        ) => {
            await queryItem(filters, locale);

            expect(mockQueryItemByField).toHaveBeenCalledTimes(1);
            expect(mockQueryItemByField).toHaveBeenCalledWith(
                expectedLocale,
                expectedItemID,
                expectedCreatorID,
            );
        },
    );

    test.each([
        ["none received", []],
        [
            "multiple received w/ no farm sizes",
            [
                createTranslatedItem({
                    name: "test 1",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                }),
                createTranslatedItem({
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
                createTranslatedItem({
                    name: "test 1",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    width: 1,
                    height: 2,
                }),
                createTranslatedItem({
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
        async (_: string, received: TranslatedItem[]) => {
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem();

            expect(actual).toHaveLength(received.length);
            expect(actual).toEqual(expect.arrayContaining(received));
        },
    );

    describe("optimal filter handling", () => {
        test("returns only the item with highest output with no tools given multiple recipes for single item (no max tool specified in filter)", async () => {
            const itemName = "item 1";
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 5,
                requirements: [],
            });
            const received = [
                expected,
                createTranslatedItem({
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
                createTranslatedItem({
                    name: itemName1,
                    createTime: 1,
                    output: 5,
                    requirements: [],
                }),
                createTranslatedItem({
                    name: itemName2,
                    createTime: 3,
                    output: 10,
                    requirements: [],
                }),
            ];
            const received = [
                ...expected,
                createTranslatedItem({
                    name: itemName1,
                    createTime: 5,
                    output: 2,
                    requirements: [],
                }),
                createTranslatedItem({
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
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 5,
                requirements: [],
                maximumTool: "steel" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItem({
                    name: itemName,
                    createTime: 1,
                    output: 8,
                    requirements: [],
                    maximumTool: "copper" as DefaultToolset,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({ optimal: {} });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("returns item with highest output given items that cannot utilize max tool available", async () => {
            const itemName = "item 1";
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                maximumTool: "steel" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItem({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    maximumTool: "copper" as DefaultToolset,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: { maxAvailableTool: "steel" as DefaultToolset },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("ignores any item that cannot be created by provided tool even if optimal", async () => {
            const itemName = "item 1";
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "none" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItem({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    minimumTool: "steel" as DefaultToolset,
                    maximumTool: "steel" as DefaultToolset,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: { maxAvailableTool: "none" as DefaultToolset },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("ignores any item that requires machine tools if no machine tools are available even if more optimal", async () => {
            const itemName = "item 1";
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "none" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItemWithMachineTools({
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
                const expected = createTranslatedItemWithMachineTools({
                    name: itemName,
                    createTime: 1,
                    output: 2,
                    requirements: [],
                });
                const received = [
                    expected,
                    createTranslatedItem({
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
            },
        );

        test("prefers optimal recipe regardless of whether item has recipe with machine tools", async () => {
            const itemName = "item 1";
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItemWithMachineTools({
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
                    maxAvailableTool: "steel" as DefaultToolset,
                },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("returns nothing if only recipe requires machine tools and no machine tools are available", async () => {
            const received = [
                createTranslatedItemWithMachineTools({
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

        test("ignores any item that requires eyeglasses if no eyeglasses are available even if more optimal", async () => {
            const itemName = "item 1";
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "none" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItemWithEyeglasses({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    minimumTool: "eyeglasses" as EyeglassesToolset,
                    maximumTool: "eyeglasses" as EyeglassesToolset,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: { hasEyeglasses: false },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test.each([
            ["default behaviour", undefined],
            ["has eyeglasses", true],
        ])(
            "returns item with eyeglasses if more optimal (%s)",
            async (_: string, hasEyeglasses: boolean | undefined) => {
                const itemName = "item 1";
                const expected = createTranslatedItemWithEyeglasses({
                    name: itemName,
                    createTime: 1,
                    output: 1.8,
                    requirements: [],
                    minimumTool: "eyeglasses" as EyeglassesToolset,
                    maximumTool: "eyeglasses" as EyeglassesToolset,
                });
                const received = [
                    expected,
                    createTranslatedItem({
                        name: itemName,
                        createTime: 1,
                        output: 2,
                        requirements: [],
                    }),
                ];
                mockQueryItemByField.mockResolvedValue(received);

                const actual = await queryItem({
                    optimal: { hasEyeglasses },
                });

                expect(actual).toHaveLength(1);
                expect(actual[0]).toEqual(expected);
            },
        );

        test("prefers optimal recipe regardless of whether item has recipe with eyeglasses", async () => {
            const itemName = "item 1";
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItemWithEyeglasses({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    minimumTool: "eyeglasses" as EyeglassesToolset,
                    maximumTool: "eyeglasses" as EyeglassesToolset,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: {
                    hasEyeglasses: true,
                    maxAvailableTool: "steel" as DefaultToolset,
                },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("returns nothing if only recipe requires eyeglasses and no eyeglasses are available", async () => {
            const received = [
                createTranslatedItemWithEyeglasses({
                    name: "test item",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    minimumTool: "eyeglasses" as EyeglassesToolset,
                    maximumTool: "eyeglasses" as EyeglassesToolset,
                }),
            ];
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem({
                optimal: {
                    hasEyeglasses: false,
                },
            });

            expect(actual).toHaveLength(0);
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
            "a minimum creator count filter is provided (default locale)",
            { minimumCreators: expectedMinimumCreators },
            undefined,
            "en-US",
            expectedMinimumCreators,
            undefined,
        ],
        [
            "a minimum creator count filter is provided (specific locale)",
            { minimumCreators: expectedMinimumCreators },
            "fr-FR",
            "fr-FR",
            expectedMinimumCreators,
            undefined,
        ],
        [
            "a minimum creator count filter is provided w/ an item ID (default locale)",
            {
                minimumCreators: expectedMinimumCreators,
                id: expectedItemID,
            },
            undefined,
            "en-US",
            expectedMinimumCreators,
            expectedItemID,
        ],
        [
            "a minimum creator count filter is provided w/ an item ID (specific locale)",
            {
                minimumCreators: expectedMinimumCreators,
                id: expectedItemID,
            },
            "fr-FR",
            "fr-FR",
            expectedMinimumCreators,
            expectedItemID,
        ],
    ])(
        "queries the database via creator count given %s",
        async (
            _: string,
            filters: QueryFilters | undefined,
            locale: string | undefined,
            expectedLocale: string,
            expectedMinimumCreators: number,
            expectedItemName: string | undefined,
        ) => {
            await queryItem(filters, locale);

            expect(mockQueryItemByCreatorCount).toHaveBeenCalledTimes(1);
            expect(mockQueryItemByCreatorCount).toHaveBeenCalledWith(
                expectedLocale,
                expectedMinimumCreators,
                expectedItemName,
            );
        },
    );

    test.each([
        ["none received", []],
        [
            "multiple received",
            [
                createTranslatedItem({
                    name: "test 1",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                }),
                createTranslatedItem({
                    name: "test 1",
                    createTime: 5,
                    output: 7,
                    requirements: [],
                }),
            ],
        ],
    ])(
        "returns all items retrieved given %s",
        async (_: string, received: TranslatedItem[]) => {
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({ minimumCreators: 1 });

            expect(actual).toHaveLength(received.length);
            expect(actual).toEqual(expect.arrayContaining(received));
        },
    );

    test("throws an error if an exception occurs while fetching item details", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByCreatorCount.mockRejectedValue(expectedError);

        expect.assertions(1);
        await expect(queryItem({ minimumCreators: 1 })).rejects.toThrow(
            expectedError,
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
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 5,
                requirements: [],
            });
            const received = [
                expected,
                createTranslatedItem({
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
                createTranslatedItem({
                    name: itemName1,
                    createTime: 1,
                    output: 5,
                    requirements: [],
                }),
                createTranslatedItem({
                    name: itemName2,
                    createTime: 3,
                    output: 10,
                    requirements: [],
                }),
            ];
            const received = [
                ...expected,
                createTranslatedItem({
                    name: itemName1,
                    createTime: 5,
                    output: 2,
                    requirements: [],
                }),
                createTranslatedItem({
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
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 5,
                requirements: [],
                maximumTool: "steel" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItem({
                    name: itemName,
                    createTime: 1,
                    output: 8,
                    requirements: [],
                    maximumTool: "copper" as DefaultToolset,
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
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                maximumTool: "steel" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItem({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    maximumTool: "copper" as DefaultToolset,
                }),
            ];
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({
                minimumCreators: 2,
                optimal: { maxAvailableTool: "steel" as DefaultToolset },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("ignores any item that cannot be created by provided tool even if optimal", async () => {
            const itemName = "item 1";
            const expected = createTranslatedItem({
                name: itemName,
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "none" as DefaultToolset,
            });
            const received = [
                expected,
                createTranslatedItem({
                    name: itemName,
                    createTime: 1,
                    output: 3,
                    requirements: [],
                    minimumTool: "steel" as DefaultToolset,
                    maximumTool: "steel" as DefaultToolset,
                }),
            ];
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({
                minimumCreators: 2,
                optimal: { maxAvailableTool: "none" as DefaultToolset },
            });

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });
    });

    test("throws an error if a minimum creator filter is provided with a creator ID filter", async () => {
        const expectedError = new Error(
            "Invalid filter combination provided: Cannot filter by minimum creator and creator ID",
        );

        expect.assertions(1);
        await expect(
            queryItem({ minimumCreators: 1, creatorID: "test creator" }),
        ).rejects.toThrow(expectedError);
    });

    test("logs an error message to console if a minimum creator filter is provided with a creator ID filter", async () => {
        const expectedError = new Error(
            "Invalid filter combination provided: Cannot filter by minimum creator and creator ID",
        );

        try {
            await queryItem({ minimumCreators: 1, creatorID: "test creator" });
        } catch {
            // Ignore
        }

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
    });
});
