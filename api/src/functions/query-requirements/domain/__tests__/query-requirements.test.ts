import { vi, Mock } from "vitest";

import { queryRequirements } from "../query-requirements";
import { queryRequirements as mongoDBQueryRequirements } from "../../adapters/mongodb-requirements-adapter";
import {
    createTranslatedItem,
    createTranslatedItemWithMachineTools,
} from "../../../../../test";
import { DefaultToolset } from "../../../../types";
import {
    QueryRequirementsParams,
    Requirement,
} from "../../interfaces/query-requirements-primary-port";
import { OutputUnit } from "../../../../common";

vi.mock("../../adapters/mongodb-requirements-adapter", () => ({
    queryRequirements: vi.fn(),
}));

const mockMongoDBQueryRequirements = mongoDBQueryRequirements as Mock;
const consoleLogSpy = vi
    .spyOn(console, "log")
    .mockImplementation(() => undefined);

const validItemName = "test item name";
const validWorkers = 5;

function findRequirement(
    requirements: Requirement[],
    itemName: string,
): Requirement | undefined {
    return requirements.find((workers) => workers.name === itemName);
}

beforeEach(() => {
    mockMongoDBQueryRequirements.mockReset();
    consoleLogSpy.mockClear();
});

test("throws an error given an empty string as an item ID", async () => {
    const expectedError = new Error(
        "Invalid item ID provided, must be a non-empty string",
    );

    expect.assertions(1);
    await expect(
        queryRequirements({ id: "", workers: validWorkers }),
    ).rejects.toThrow(expectedError);
});

test.each([
    ["equal to zero", 0],
    ["less than zero", -1],
])(
    "throws an error given number of workers that is %s",
    async (_: string, workers: number) => {
        const expectedError = new Error(
            "Invalid number of workers provided, must be a positive number",
        );

        expect.assertions(1);
        await expect(
            queryRequirements({ id: "testid", workers }),
        ).rejects.toThrow(expectedError);
    },
);

test.each([
    ["default locale", undefined, "en-US"],
    ["specified locale", "fr-FR", "fr-FR"],
])(
    "calls the database adapter to get the requirements given valid input and %s",
    async (_: string, locale: string | undefined, expectedLocale: string) => {
        const item = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [],
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item]);

        await queryRequirements({
            id: item.id,
            workers: validWorkers,
            ...(locale ? { locale } : {}),
        });

        expect(mockMongoDBQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockMongoDBQueryRequirements).toHaveBeenCalledWith({
            id: item.id,
            locale: expectedLocale,
        });
    },
);

test("throws an error if no requirements are returned at all (item does not exist)", async () => {
    mockMongoDBQueryRequirements.mockResolvedValue([]);
    const expectedError = new Error("Unknown item provided");

    expect.assertions(1);
    await expect(
        queryRequirements({ id: "testid", workers: validWorkers }),
    ).rejects.toThrow(expectedError);
});

test("throws an error if the provided item details are not returned from DB", async () => {
    const item = createTranslatedItem({
        name: "anotheritem",
        createTime: 2,
        output: 3,
        requirements: [],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item]);
    const expectedError = new Error("Unknown item provided");

    expect.assertions(1);
    await expect(
        queryRequirements({ id: "test", workers: validWorkers }),
    ).rejects.toThrow(expectedError);
});

test("returns only output details fo provided item given provided item has no requirements", async () => {
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item]);

    const actual = await queryRequirements({
        id: item.id,
        workers: validWorkers,
    });

    expect(actual).toEqual([
        {
            id: item.id,
            name: item.name,
            amount: 7.5,
            creators: [
                {
                    id: item.id,
                    name: item.name,
                    creatorID: item.creatorID,
                    creator: item.creator,
                    amount: 7.5,
                    workers: 5,
                    demands: [],
                },
            ],
        },
    ]);
});

test("throws an error if provided item requires an item that does not exist in database", async () => {
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ id: "unknown item", amount: 4 }],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item]);
    const expectedError = new Error("Internal server error");

    expect.assertions(1);
    await expect(
        queryRequirements({ id: item.id, workers: validWorkers }),
    ).rejects.toThrow(expectedError);
});

test("returns requirements given item with a single requirement and no nested requirements", async () => {
    const requiredItem = createTranslatedItem({
        name: "required item",
        createTime: 3,
        output: 4,
        requirements: [],
    });
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ id: requiredItem.id, amount: 4 }],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

    const actual = await queryRequirements({
        id: item.id,
        workers: validWorkers,
    });

    expect(actual).toEqual([
        {
            id: item.id,
            name: item.name,
            amount: 7.5,
            creators: [
                {
                    id: item.id,
                    name: item.name,
                    creatorID: item.creatorID,
                    creator: item.creator,
                    amount: 7.5,
                    workers: 5,
                    demands: [
                        {
                            id: requiredItem.id,
                            name: requiredItem.name,
                            amount: 10,
                        },
                    ],
                },
            ],
        },
        {
            id: requiredItem.id,
            name: requiredItem.name,
            amount: 10,
            creators: [
                {
                    id: requiredItem.id,
                    name: requiredItem.name,
                    creatorID: requiredItem.creatorID,
                    creator: requiredItem.creator,
                    amount: 10,
                    workers: 7.5,
                    demands: [],
                },
            ],
        },
    ]);
});

test("returns requirements given item with multiple requirements and no nested requirements", async () => {
    const requiredItem1 = createTranslatedItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [],
    });
    const requiredItem2 = createTranslatedItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [
            { id: requiredItem1.id, amount: 4 },
            { id: requiredItem2.id, amount: 6 },
        ],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
    ]);

    const actual = await queryRequirements({
        id: item.id,
        workers: validWorkers,
    });

    expect(actual).toEqual([
        {
            id: item.id,
            name: item.name,
            amount: 7.5,
            creators: [
                {
                    id: item.id,
                    name: item.name,
                    creatorID: item.creatorID,
                    creator: item.creator,
                    amount: 7.5,
                    workers: 5,
                    demands: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            amount: 10,
                        },
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            amount: 15,
                        },
                    ],
                },
            ],
        },
        {
            id: requiredItem1.id,
            name: requiredItem1.name,
            amount: 10,
            creators: [
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    creatorID: requiredItem1.creatorID,
                    creator: requiredItem1.creator,
                    amount: 10,
                    workers: 7.5,
                    demands: [],
                },
            ],
        },
        {
            id: requiredItem2.id,
            name: requiredItem2.name,
            amount: 15,
            creators: [
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    creatorID: requiredItem2.creatorID,
                    creator: requiredItem2.creator,
                    amount: 15,
                    workers: 30,
                    demands: [],
                },
            ],
        },
    ]);
});

test("returns requirements given item with single nested requirement", async () => {
    const requiredItem2 = createTranslatedItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem1 = createTranslatedItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [{ id: requiredItem2.id, amount: 6 }],
    });
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ id: requiredItem1.id, amount: 4 }],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
    ]);

    const actual = await queryRequirements({
        id: item.id,
        workers: validWorkers,
    });

    expect(actual).toEqual([
        {
            id: item.id,
            name: item.name,
            amount: 7.5,
            creators: [
                {
                    id: item.id,
                    name: item.name,
                    creatorID: item.creatorID,
                    creator: item.creator,
                    amount: 7.5,
                    workers: 5,
                    demands: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            amount: 10,
                        },
                    ],
                },
            ],
        },
        {
            id: requiredItem1.id,
            name: requiredItem1.name,
            amount: 10,
            creators: [
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    creatorID: requiredItem1.creatorID,
                    creator: requiredItem1.creator,
                    amount: 10,
                    workers: 7.5,
                    demands: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            amount: 15,
                        },
                    ],
                },
            ],
        },
        {
            id: requiredItem2.id,
            name: requiredItem2.name,
            amount: 15,
            creators: [
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    creatorID: requiredItem2.creatorID,
                    creator: requiredItem2.creator,
                    amount: 15,
                    workers: 30,
                    demands: [],
                },
            ],
        },
    ]);
});

test("returns requirements given item with multiple different nested requirements", async () => {
    const requiredItem3 = createTranslatedItem({
        name: "required item 3",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem2 = createTranslatedItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem1 = createTranslatedItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [
            { id: requiredItem2.id, amount: 6 },
            { id: requiredItem3.id, amount: 4 },
        ],
    });
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ id: requiredItem1.id, amount: 4 }],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
        requiredItem3,
    ]);

    const actual = await queryRequirements({
        id: item.id,
        workers: validWorkers,
    });

    expect(actual).toEqual([
        {
            id: item.id,
            name: item.name,
            amount: 7.5,
            creators: [
                {
                    id: item.id,
                    name: item.name,
                    creatorID: item.creatorID,
                    creator: item.creator,
                    amount: 7.5,
                    workers: 5,
                    demands: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            amount: 10,
                        },
                    ],
                },
            ],
        },
        {
            id: requiredItem1.id,
            name: requiredItem1.name,
            amount: 10,
            creators: [
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    creatorID: requiredItem1.creatorID,
                    creator: requiredItem1.creator,
                    amount: 10,
                    workers: 7.5,
                    demands: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            amount: 15,
                        },
                        {
                            id: requiredItem3.id,
                            name: requiredItem3.name,
                            amount: 10,
                        },
                    ],
                },
            ],
        },
        {
            id: requiredItem2.id,
            name: requiredItem2.name,
            amount: 15,
            creators: [
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    creatorID: requiredItem2.creatorID,
                    creator: requiredItem2.creator,
                    amount: 15,
                    workers: 30,
                    demands: [],
                },
            ],
        },
        {
            id: requiredItem3.id,
            name: requiredItem3.name,
            amount: 10,
            creators: [
                {
                    id: requiredItem3.id,
                    name: requiredItem3.name,
                    creatorID: requiredItem3.creatorID,
                    creator: requiredItem3.creator,
                    amount: 10,
                    workers: 20,
                    demands: [],
                },
            ],
        },
    ]);
});

test("returns combined requirements given item with multiple nested requirements with common requirement", async () => {
    const requiredItem3 = createTranslatedItem({
        name: "required item 3",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem2 = createTranslatedItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem1 = createTranslatedItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [
            { id: requiredItem2.id, amount: 6 },
            { id: requiredItem3.id, amount: 4 },
        ],
    });
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [
            { id: requiredItem1.id, amount: 4 },
            { id: requiredItem3.id, amount: 2 },
        ],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
        requiredItem3,
    ]);

    const actual = await queryRequirements({
        id: item.id,
        workers: validWorkers,
    });

    expect(actual).toEqual([
        {
            id: item.id,
            name: item.name,
            amount: 7.5,
            creators: [
                {
                    id: item.id,
                    name: item.name,
                    creatorID: item.creatorID,
                    creator: item.creator,
                    amount: 7.5,
                    workers: 5,
                    demands: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            amount: 10,
                        },
                        {
                            id: requiredItem3.id,
                            name: requiredItem3.name,
                            amount: 5,
                        },
                    ],
                },
            ],
        },
        {
            id: requiredItem1.id,
            name: requiredItem1.name,
            amount: 10,
            creators: [
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    creatorID: requiredItem1.creatorID,
                    creator: requiredItem1.creator,
                    amount: 10,
                    workers: 7.5,
                    demands: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            amount: 15,
                        },
                        {
                            id: requiredItem3.id,
                            name: requiredItem3.name,
                            amount: 10,
                        },
                    ],
                },
            ],
        },
        {
            id: requiredItem3.id,
            name: requiredItem3.name,
            amount: 15,
            creators: [
                {
                    id: requiredItem3.id,
                    name: requiredItem3.name,
                    creatorID: requiredItem3.creatorID,
                    creator: requiredItem3.creator,
                    amount: 15,
                    workers: 30,
                    demands: [],
                },
            ],
        },
        {
            id: requiredItem2.id,
            name: requiredItem2.name,
            amount: 15,
            creators: [
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    creatorID: requiredItem2.creatorID,
                    creator: requiredItem2.creator,
                    amount: 15,
                    workers: 30,
                    demands: [],
                },
            ],
        },
    ]);
});

test("throws an error if an unhandled exception occurs while fetching item requirements", async () => {
    mockMongoDBQueryRequirements.mockRejectedValue(new Error("unhandled"));
    const expectedError = new Error("Internal server error");

    expect.assertions(1);
    await expect(
        queryRequirements({ id: "testid", workers: validWorkers }),
    ).rejects.toThrow(expectedError);
});

describe("handles tool modifiers", () => {
    test.each([
        [
            "stone min, none provided",
            "stone" as DefaultToolset,
            "none" as DefaultToolset,
        ],
        [
            "copper min, stone provided",
            "copper" as DefaultToolset,
            "stone" as DefaultToolset,
        ],
        [
            "iron min, copper provided",
            "iron" as DefaultToolset,
            "copper" as DefaultToolset,
        ],
        [
            "bronze min, iron provided",
            "bronze" as DefaultToolset,
            "iron" as DefaultToolset,
        ],
        [
            "steel min, bronze provided",
            "steel" as DefaultToolset,
            "bronze" as DefaultToolset,
        ],
    ])(
        "throws an error if the provided tool is less the minimum requirement for the specified item (%s)",
        async (
            _: string,
            minimum: DefaultToolset,
            provided: DefaultToolset,
        ) => {
            const item = createTranslatedItem({
                name: validItemName,
                createTime: 2,
                output: 3,
                requirements: [],
                minimumTool: minimum,
                maximumTool: "steel" as DefaultToolset,
            });
            mockMongoDBQueryRequirements.mockResolvedValue([item]);
            const expectedError = `Unable to create item with available tools, minimum tool is: ${minimum.toLowerCase()}`;

            expect.assertions(1);
            await expect(
                queryRequirements({
                    id: item.id,
                    workers: validWorkers,
                    maxAvailableTool: provided,
                }),
            ).rejects.toThrow(expectedError);
        },
    );

    test.each([
        [
            "stone min, none provided",
            "stone" as DefaultToolset,
            "none" as DefaultToolset,
        ],
        [
            "copper min, stone provided",
            "copper" as DefaultToolset,
            "stone" as DefaultToolset,
        ],
        [
            "iron min, copper provided",
            "iron" as DefaultToolset,
            "copper" as DefaultToolset,
        ],
        [
            "bronze min, iron provided",
            "bronze" as DefaultToolset,
            "iron" as DefaultToolset,
        ],
        [
            "steel min, bronze provided",
            "steel" as DefaultToolset,
            "bronze" as DefaultToolset,
        ],
    ])(
        "throws an error if the provided tool is less the minimum requirement for any item's requirements (%s)",
        async (
            _: string,
            minimum: DefaultToolset,
            provided: DefaultToolset,
        ) => {
            const requiredItem = createTranslatedItem({
                name: "another item",
                createTime: 2,
                output: 3,
                requirements: [],
                minimumTool: minimum,
                maximumTool: "steel" as DefaultToolset,
            });
            const item = createTranslatedItem({
                name: validItemName,
                createTime: 2,
                output: 3,
                requirements: [{ id: requiredItem.id, amount: 3 }],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            });
            mockMongoDBQueryRequirements.mockResolvedValue([
                item,
                requiredItem,
            ]);
            const expectedError = `Unable to create item with available tools, minimum tool is: ${minimum.toLowerCase()}`;

            expect.assertions(1);
            await expect(
                queryRequirements({
                    id: item.id,
                    workers: validWorkers,
                    maxAvailableTool: provided,
                }),
            ).rejects.toThrow(expectedError);
        },
    );

    test("throws an error with lowest required tool in message given multiple items w/ unmet tool requirements", async () => {
        const expectedMinimumTool = "iron" as DefaultToolset;
        const requiredItem = createTranslatedItem({
            name: "another item",
            createTime: 2,
            output: 3,
            requirements: [],
            minimumTool: "stone" as DefaultToolset,
            maximumTool: "steel" as DefaultToolset,
        });
        const item = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 3 }],
            minimumTool: "iron" as DefaultToolset,
            maximumTool: "steel" as DefaultToolset,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([requiredItem, item]);
        const expectedError = `Unable to create item with available tools, minimum tool is: ${expectedMinimumTool}`;

        expect.assertions(1);
        await expect(
            queryRequirements({ id: item.id, workers: validWorkers }),
        ).rejects.toThrow(expectedError);
    });

    test.each([
        ["none" as DefaultToolset, 7.5, 5],
        ["stone" as DefaultToolset, 15, 10],
        ["copper" as DefaultToolset, 30, 20],
        ["iron" as DefaultToolset, 39.75, 26.5],
        ["bronze" as DefaultToolset, 46.125, 30.75],
        ["steel" as DefaultToolset, 60, 40],
    ])(
        "returns expected output for requirement given item with applicable tool: %s and requirement with no tools",
        async (
            provided: DefaultToolset,
            expectedOutput: number,
            expectedWorkers: number,
        ) => {
            const requiredItemName = "another item";
            const requiredItem = createTranslatedItem({
                name: requiredItemName,
                createTime: 2,
                output: 3,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "none" as DefaultToolset,
            });
            const item = createTranslatedItem({
                name: validItemName,
                createTime: 2,
                output: 3,
                requirements: [{ id: requiredItem.id, amount: 3 }],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            });
            mockMongoDBQueryRequirements.mockResolvedValue([
                item,
                requiredItem,
            ]);

            const actual = await queryRequirements({
                id: item.id,
                workers: validWorkers,
                maxAvailableTool: provided,
            });

            const requirement = findRequirement(
                actual,
                requiredItemName,
            ) as Requirement;

            expect(requirement.amount).toBeCloseTo(expectedOutput);
            expect(requirement.creators[0]?.amount).toBeCloseTo(expectedOutput);
            expect(requirement.creators[0]?.workers).toBeCloseTo(
                expectedWorkers,
            );
        },
    );

    test("returns required output/workers to satisfy input item given tool better than applicable to input item", async () => {
        const requiredItemName = "another item";
        const requiredItem = createTranslatedItem({
            name: requiredItemName,
            createTime: 2,
            output: 3,
            requirements: [],
            minimumTool: "none" as DefaultToolset,
            maximumTool: "none" as DefaultToolset,
        });
        const item = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 3 }],
            minimumTool: "none" as DefaultToolset,
            maximumTool: "copper" as DefaultToolset,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

        const actual = await queryRequirements({
            id: item.id,
            workers: validWorkers,
            maxAvailableTool: "steel" as DefaultToolset,
        });
        const requirement = findRequirement(
            actual,
            requiredItemName,
        ) as Requirement;

        expect(requirement.amount).toBeCloseTo(30);
        expect(requirement.creators[0]?.amount).toBeCloseTo(30);
        expect(requirement.creators[0]?.workers).toBeCloseTo(20);
    });

    test("reduces required workers for requirement if tool provided is applicable to requirement and not input item", async () => {
        const requiredItemName = "another item";
        const requiredItem = createTranslatedItem({
            name: requiredItemName,
            createTime: 2,
            output: 3,
            requirements: [],
            minimumTool: "none" as DefaultToolset,
            maximumTool: "steel" as DefaultToolset,
        });
        const item = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 3 }],
            minimumTool: "none" as DefaultToolset,
            maximumTool: "none" as DefaultToolset,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

        const actual = await queryRequirements({
            id: item.id,
            workers: validWorkers,
            maxAvailableTool: "steel" as DefaultToolset,
        });
        const requirement = findRequirement(
            actual,
            requiredItemName,
        ) as Requirement;

        expect(requirement.creators[0]?.workers).toBeCloseTo(0.625);
    });

    test("reduces required workers for required item to max applicable to requirement given better tool applicable to only requirement", async () => {
        const requiredItemName = "another item";
        const requiredItem = createTranslatedItem({
            name: requiredItemName,
            createTime: 2,
            output: 3,
            requirements: [],
            minimumTool: "none" as DefaultToolset,
            maximumTool: "copper" as DefaultToolset,
        });
        const item = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 3 }],
            minimumTool: "none" as DefaultToolset,
            maximumTool: "none" as DefaultToolset,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

        const actual = await queryRequirements({
            id: item.id,
            workers: validWorkers,
            maxAvailableTool: "steel" as DefaultToolset,
        });
        const requirement = findRequirement(
            actual,
            requiredItemName,
        ) as Requirement;

        expect(requirement.creators[0]?.workers).toBeCloseTo(1.25);
    });
});

describe("optional output requirement impact", () => {
    test("factors optional output given item with single requirement that is also optional output", async () => {
        const requiredItem = createTranslatedItem({
            name: "required item 1",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const item = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 2 }],
            optionalOutputs: [
                { id: requiredItem.id, amount: 1, likelihood: 0.5 },
            ],
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

        const actual = await queryRequirements({
            id: item.id,
            workers: validWorkers,
        });

        expect(actual).toEqual([
            {
                id: item.id,
                name: item.name,
                amount: 7.5,
                creators: [
                    {
                        id: item.id,
                        name: item.name,
                        creatorID: item.creatorID,
                        creator: item.creator,
                        amount: 7.5,
                        workers: 5,
                        demands: [
                            {
                                id: requiredItem.id,
                                name: requiredItem.name,
                                amount: 5,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem.id,
                name: requiredItem.name,
                amount: 5,
                creators: [
                    {
                        id: item.id,
                        name: item.name,
                        creatorID: item.creatorID,
                        creator: item.creator,
                        amount: 1.25,
                        workers: 5,
                        demands: [],
                    },
                    {
                        id: requiredItem.id,
                        name: requiredItem.name,
                        creatorID: requiredItem.creatorID,
                        creator: requiredItem.creator,
                        amount: 3.75,
                        workers: 2.8125,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("factors optional output given item with nested requirement that is top level optional output", async () => {
        const requiredItem2 = createTranslatedItem({
            name: "required item 2",
            createTime: 4,
            output: 2,
            requirements: [],
        });
        const requiredItem1 = createTranslatedItem({
            name: "required item 1",
            createTime: 3,
            output: 4,
            requirements: [{ id: requiredItem2.id, amount: 6 }],
        });
        const item = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem1.id, amount: 4 }],
            optionalOutputs: [
                { id: requiredItem2.id, amount: 2, likelihood: 0.5 },
            ],
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            item,
            requiredItem1,
            requiredItem2,
        ]);

        const actual = await queryRequirements({
            id: item.id,
            workers: validWorkers,
        });

        expect(actual).toEqual([
            {
                id: item.id,
                name: item.name,
                amount: 7.5,
                creators: [
                    {
                        id: item.id,
                        name: item.name,
                        creatorID: item.creatorID,
                        creator: item.creator,
                        amount: 7.5,
                        workers: 5,
                        demands: [
                            {
                                id: requiredItem1.id,
                                name: requiredItem1.name,
                                amount: 10,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem1.id,
                name: requiredItem1.name,
                amount: 10,
                creators: [
                    {
                        id: requiredItem1.id,
                        name: requiredItem1.name,
                        creatorID: requiredItem1.creatorID,
                        creator: requiredItem1.creator,
                        amount: 10,
                        workers: 7.5,
                        demands: [
                            {
                                id: requiredItem2.id,
                                name: requiredItem2.name,
                                amount: 15,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem2.id,
                name: requiredItem2.name,
                amount: 15,
                creators: [
                    {
                        id: item.id,
                        name: item.name,
                        creatorID: item.creatorID,
                        creator: item.creator,
                        amount: 2.5,
                        workers: 5,
                        demands: [],
                    },
                    {
                        id: requiredItem2.id,
                        name: requiredItem2.name,
                        creatorID: requiredItem2.creatorID,
                        creator: requiredItem2.creator,
                        amount: 12.5,
                        workers: 25,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("uses recipe with high optional output over lower base output", async () => {
        const requirementName = "required item";
        const higherBaseRecipe = createTranslatedItem({
            name: requirementName,
            createTime: 3,
            output: 4,
            requirements: [],
            creator: "creator 1",
        });
        const higherOptionalOutputRecipe = createTranslatedItem({
            name: requirementName,
            createTime: 3,
            output: 1,
            requirements: [],
            optionalOutputs: [
                { id: higherBaseRecipe.id, amount: 4, likelihood: 1 },
            ],
            creator: "creator 2",
        });
        const item = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: higherBaseRecipe.id, amount: 2 }],
            optionalOutputs: [],
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            item,
            higherBaseRecipe,
            higherOptionalOutputRecipe,
        ]);

        const actual = await queryRequirements({
            id: item.id,
            workers: validWorkers,
        });

        expect(actual).toEqual([
            {
                id: item.id,
                name: item.name,
                amount: 7.5,
                creators: [
                    {
                        id: item.id,
                        name: item.name,
                        creatorID: item.creatorID,
                        creator: item.creator,
                        amount: 7.5,
                        workers: 5,
                        demands: [
                            {
                                id: higherBaseRecipe.id,
                                name: requirementName,
                                amount: 5,
                            },
                        ],
                    },
                ],
            },
            {
                id: higherBaseRecipe.id,
                name: requirementName,
                amount: 5,
                creators: [
                    {
                        id: higherOptionalOutputRecipe.id,
                        name: requirementName,
                        creatorID: higherOptionalOutputRecipe.creatorID,
                        creator: higherOptionalOutputRecipe.creator,
                        amount: 5,
                        workers: 3,
                        demands: [],
                    },
                ],
            },
        ]);
    });
});

describe("multiple recipe handling", () => {
    test("uses the recipe with most output when an item has more than one creator", async () => {
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creator: "creator 1",
        });
        const moreOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creator: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            id: moreOptimalItemRecipe.id,
            workers: validWorkers,
        });

        expect(actual).toEqual([
            {
                id: moreOptimalItemRecipe.id,
                name: validItemName,
                amount: 15,
                creators: [
                    {
                        id: moreOptimalItemRecipe.id,
                        name: validItemName,
                        creatorID: moreOptimalItemRecipe.creatorID,
                        creator: moreOptimalItemRecipe.creator,
                        amount: 15,
                        workers: 5,
                        demands: [
                            {
                                id: requiredItem.id,
                                name: requiredItem.name,
                                amount: 20,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem.id,
                name: requiredItem.name,
                amount: 20,
                creators: [
                    {
                        id: requiredItem.id,
                        name: requiredItem.name,
                        creatorID: requiredItem.creatorID,
                        creator: requiredItem.creator,
                        amount: 20,
                        workers: 15,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("factors max available tool into most output calculation when given item w/ lower base output but higher modified", async () => {
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creator: "creator 1",
            maximumTool: "stone" as DefaultToolset,
        });
        const moreOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creator: "creator 2",
            maximumTool: "steel" as DefaultToolset,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            id: moreOptimalItemRecipe.id,
            workers: validWorkers,
            maxAvailableTool: "steel" as DefaultToolset,
        });

        expect(actual).toEqual([
            {
                id: moreOptimalItemRecipe.id,
                name: validItemName,
                amount: 60,
                creators: [
                    {
                        id: moreOptimalItemRecipe.id,
                        name: validItemName,
                        creatorID: moreOptimalItemRecipe.creatorID,
                        creator: moreOptimalItemRecipe.creator,
                        amount: 60,
                        workers: 5,
                        demands: [
                            {
                                id: requiredItem.id,
                                name: requiredItem.name,
                                amount: 80,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem.id,
                name: requiredItem.name,
                amount: 80,
                creators: [
                    {
                        id: requiredItem.id,
                        name: requiredItem.name,
                        creatorID: requiredItem.creatorID,
                        creator: requiredItem.creator,
                        amount: 80,
                        workers: 60,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("ignores more optimal recipe if cannot be created by provided max tool", async () => {
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: "creator 1",
            maximumTool: "stone" as DefaultToolset,
        });
        const moreOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 6,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: "creator 2",
            minimumTool: "steel" as DefaultToolset,
            maximumTool: "steel" as DefaultToolset,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            id: moreOptimalItemRecipe.id,
            workers: validWorkers,
        });

        expect(actual).toEqual([
            {
                id: lessOptimalItemRecipe.id,
                name: validItemName,
                amount: 7.5,
                creators: [
                    {
                        id: lessOptimalItemRecipe.id,
                        name: validItemName,
                        creatorID: lessOptimalItemRecipe.creatorID,
                        creator: lessOptimalItemRecipe.creator,
                        amount: 7.5,
                        workers: 5,
                        demands: [
                            {
                                id: requiredItem.id,
                                name: requiredItem.name,
                                amount: 10,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem.id,
                name: requiredItem.name,
                amount: 10,
                creators: [
                    {
                        id: requiredItem.id,
                        name: requiredItem.name,
                        creatorID: requiredItem.creatorID,
                        creator: requiredItem.creator,
                        amount: 10,
                        workers: 7.5,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("does not return any required items if the required item was related to a sub optimal recipe", async () => {
        const moreOptimalRequiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalRequiredItem = createTranslatedItem({
            name: "another required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: lessOptimalRequiredItem.id, amount: 4 }],
            creatorID: "creator 1",
        });
        const moreOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 6,
            requirements: [{ id: moreOptimalRequiredItem.id, amount: 4 }],
            creatorID: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            moreOptimalRequiredItem,
            lessOptimalRequiredItem,
        ]);

        const actual = await queryRequirements({
            id: moreOptimalItemRecipe.id,
            workers: validWorkers,
        });

        expect(actual).toEqual([
            {
                id: moreOptimalItemRecipe.id,
                name: validItemName,
                amount: 30,
                creators: [
                    {
                        id: moreOptimalItemRecipe.id,
                        name: validItemName,
                        creatorID: moreOptimalItemRecipe.creatorID,
                        creator: moreOptimalItemRecipe.creator,
                        amount: 30,
                        workers: 5,
                        demands: [
                            {
                                id: moreOptimalRequiredItem.id,
                                name: moreOptimalRequiredItem.name,
                                amount: 20,
                            },
                        ],
                    },
                ],
            },
            {
                id: moreOptimalRequiredItem.id,
                name: moreOptimalRequiredItem.name,
                amount: 20,
                creators: [
                    {
                        id: moreOptimalRequiredItem.id,
                        name: moreOptimalRequiredItem.name,
                        creatorID: moreOptimalRequiredItem.creatorID,
                        creator: moreOptimalRequiredItem.creator,
                        amount: 20,
                        workers: 15,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("throws an error if an item cannot be created by any recipe w/ provided tools", async () => {
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creator: "creator 1",
            maximumTool: "stone" as DefaultToolset,
            minimumTool: "stone" as DefaultToolset,
        });
        const moreOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 6,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creator: "creator 2",
            minimumTool: "steel" as DefaultToolset,
            maximumTool: "steel" as DefaultToolset,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);
        const expectedError = `Unable to create item with available tools, minimum tool is: stone`;

        expect.assertions(1);
        await expect(
            queryRequirements({
                id: moreOptimalItemRecipe.id,
                workers: validWorkers,
            }),
        ).rejects.toThrow(expectedError);
    });
});

describe("creator override handling", () => {
    test("overrides more optimal recipe when given applicable item override", async () => {
        const overrideCreator = "override creator";
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: overrideCreator,
        });
        const moreOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            id: moreOptimalItemRecipe.id,
            workers: validWorkers,
            creatorOverrides: [
                {
                    itemID: moreOptimalItemRecipe.id,
                    creatorID: overrideCreator,
                },
            ],
        });

        expect(actual).toEqual([
            {
                id: lessOptimalItemRecipe.id,
                name: validItemName,
                amount: 7.5,
                creators: [
                    {
                        id: lessOptimalItemRecipe.id,
                        name: validItemName,
                        creatorID: lessOptimalItemRecipe.creatorID,
                        creator: lessOptimalItemRecipe.creator,
                        amount: 7.5,
                        workers: 5,
                        demands: [
                            {
                                id: requiredItem.id,
                                name: requiredItem.name,
                                amount: 10,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem.id,
                name: requiredItem.name,
                amount: 10,
                creators: [
                    {
                        id: requiredItem.id,
                        name: requiredItem.name,
                        creatorID: requiredItem.creatorID,
                        creator: requiredItem.creator,
                        amount: 10,
                        workers: 7.5,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("favours less optimal requirement recipe given applicable requirement override", async () => {
        const requiredItemName = "required item";
        const overrideCreator = "override creator";
        const moreOptimalRequirementRecipe = createTranslatedItem({
            name: requiredItemName,
            createTime: 1,
            output: 4,
            requirements: [],
        });
        const lessOptimalRequirementRecipe = createTranslatedItem({
            name: requiredItemName,
            createTime: 3,
            output: 4,
            requirements: [],
            creatorID: overrideCreator,
        });
        const recipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: moreOptimalRequirementRecipe.id, amount: 4 }],
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            recipe,
            moreOptimalRequirementRecipe,
            lessOptimalRequirementRecipe,
        ]);

        const actual = await queryRequirements({
            id: recipe.id,
            workers: validWorkers,
            creatorOverrides: [
                {
                    itemID: moreOptimalRequirementRecipe.id,
                    creatorID: overrideCreator,
                },
            ],
        });

        expect(actual).toEqual([
            {
                id: recipe.id,
                name: validItemName,
                amount: 15,
                creators: [
                    {
                        id: recipe.id,
                        name: validItemName,
                        creatorID: recipe.creatorID,
                        creator: recipe.creator,
                        amount: 15,
                        workers: 5,
                        demands: [
                            {
                                id: moreOptimalRequirementRecipe.id,
                                name: requiredItemName,
                                amount: 20,
                            },
                        ],
                    },
                ],
            },
            {
                id: moreOptimalRequirementRecipe.id,
                name: requiredItemName,
                amount: 20,
                creators: [
                    {
                        id: lessOptimalRequirementRecipe.id,
                        name: requiredItemName,
                        creatorID: lessOptimalRequirementRecipe.creatorID,
                        creator: lessOptimalRequirementRecipe.creator,
                        amount: 20,
                        workers: 15,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("throws an error if provided more than one override for a single item", async () => {
        const overrideCreator = "override creator";
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const recipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: overrideCreator,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([recipe, requiredItem]);
        const expectedError = `Invalid input: More than one creator override provided for: ${recipe.id}`;

        expect.assertions(1);
        await expect(
            queryRequirements({
                id: recipe.id,
                workers: validWorkers,
                creatorOverrides: [
                    { itemID: recipe.id, creatorID: overrideCreator },
                    { itemID: recipe.id, creatorID: "another creator" },
                ],
            }),
        ).rejects.toThrow(expectedError);
    });

    test("ignores any provided override that is irrelevant to calculating requirements", async () => {
        const overrideCreator = "override creator";
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: overrideCreator,
        });
        const moreOptimalItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            id: moreOptimalItemRecipe.id,
            workers: validWorkers,
            creatorOverrides: [
                { itemID: "another item", creatorID: overrideCreator },
            ],
        });

        expect(actual).toEqual([
            {
                id: moreOptimalItemRecipe.id,
                name: validItemName,
                amount: 15,
                creators: [
                    {
                        id: moreOptimalItemRecipe.id,
                        name: validItemName,
                        creatorID: moreOptimalItemRecipe.creatorID,
                        creator: moreOptimalItemRecipe.creator,
                        amount: 15,
                        workers: 5,
                        demands: [
                            {
                                id: requiredItem.id,
                                name: requiredItem.name,
                                amount: 20,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem.id,
                name: requiredItem.name,
                amount: 20,
                creators: [
                    {
                        id: requiredItem.id,
                        name: requiredItem.name,
                        creatorID: requiredItem.creatorID,
                        creator: requiredItem.creator,
                        amount: 20,
                        workers: 15,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("does not return any requirement that relates to a recipe that was removed by an override", async () => {
        const override = "test override creator";
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const overriddenRequirement = createTranslatedItem({
            name: "overridden item requirement",
            createTime: 2,
            output: 1,
            requirements: [],
        });
        const removedItemRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: overriddenRequirement.id, amount: 4 }],
        });
        const usedRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: override,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            usedRecipe,
            removedItemRecipe,
            overriddenRequirement,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            id: usedRecipe.id,
            workers: validWorkers,
            creatorOverrides: [{ itemID: usedRecipe.id, creatorID: override }],
        });

        expect(actual).toEqual([
            {
                id: usedRecipe.id,
                name: validItemName,
                amount: 15,
                creators: [
                    {
                        id: usedRecipe.id,
                        name: validItemName,
                        creatorID: usedRecipe.creatorID,
                        creator: usedRecipe.creator,
                        amount: 15,
                        workers: 5,
                        demands: [
                            {
                                id: requiredItem.id,
                                name: requiredItem.name,
                                amount: 20,
                            },
                        ],
                    },
                ],
            },
            {
                id: requiredItem.id,
                name: requiredItem.name,
                amount: 20,
                creators: [
                    {
                        id: requiredItem.id,
                        name: requiredItem.name,
                        creatorID: requiredItem.creatorID,
                        creator: requiredItem.creator,
                        amount: 20,
                        workers: 15,
                        demands: [],
                    },
                ],
            },
        ]);
    });

    test("throws an error if the provided override would result in no recipe being known for a given item (root override)", async () => {
        const override = "another creator";
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const recipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: "test creator",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([recipe, requiredItem]);
        const expectedError =
            "Invalid input, item is not creatable with current overrides";

        expect.assertions(1);
        await expect(
            queryRequirements({
                id: recipe.id,
                workers: validWorkers,
                creatorOverrides: [{ itemID: recipe.id, creatorID: override }],
            }),
        ).rejects.toThrow(expectedError);
    });

    test("throws an error if the provided override would result in no recipe being known for a given item (requirement override)", async () => {
        const override = "another creator";
        const requiredItem = createTranslatedItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const recipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: requiredItem.id, amount: 4 }],
            creatorID: "test creator",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([recipe, requiredItem]);
        const expectedError =
            "Invalid input, item is not creatable with current overrides";

        expect.assertions(1);
        await expect(
            queryRequirements({
                id: recipe.id,
                workers: validWorkers,
                creatorOverrides: [
                    { itemID: requiredItem.id, creatorID: override },
                ],
            }),
        ).rejects.toThrow(expectedError);
    });

    test("does not return any requirement related to optimal but un-creatable recipes if override removes requirement", async () => {
        const lessOptimalRecipeRequirement = createTranslatedItem({
            name: "less optimal item requirement",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const moreOptimalRecipeRequirement = createTranslatedItem({
            name: "more optimal required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ id: lessOptimalRecipeRequirement.id, amount: 4 }],
            creatorID: "creator 1",
        });
        const moreOptimalRecipe = createTranslatedItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ id: moreOptimalRecipeRequirement.id, amount: 4 }],
            creatorID: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            moreOptimalRecipe,
            lessOptimalRecipe,
            moreOptimalRecipeRequirement,
            lessOptimalRecipeRequirement,
        ]);

        const actual = await queryRequirements({
            id: moreOptimalRecipe.id,
            workers: validWorkers,
            creatorOverrides: [
                {
                    itemID: moreOptimalRecipeRequirement.id,
                    creatorID: "unknown creator",
                },
            ],
        });

        expect(actual).toEqual([
            {
                id: lessOptimalRecipe.id,
                name: validItemName,
                amount: 7.5,
                creators: [
                    {
                        id: lessOptimalRecipe.id,
                        name: validItemName,
                        creatorID: lessOptimalRecipe.creatorID,
                        creator: lessOptimalRecipe.creator,
                        amount: 7.5,
                        workers: 5,
                        demands: [
                            {
                                id: lessOptimalRecipeRequirement.id,
                                name: lessOptimalRecipeRequirement.name,
                                amount: 10,
                            },
                        ],
                    },
                ],
            },
            {
                id: lessOptimalRecipeRequirement.id,
                name: lessOptimalRecipeRequirement.name,
                amount: 10,
                creators: [
                    {
                        id: lessOptimalRecipeRequirement.id,
                        name: lessOptimalRecipeRequirement.name,
                        creatorID: lessOptimalRecipeRequirement.creatorID,
                        creator: lessOptimalRecipeRequirement.creator,
                        amount: 10,
                        workers: 7.5,
                        demands: [],
                    },
                ],
            },
        ]);
    });
});

describe("handles multiple output units", () => {
    const requiredItem1 = createTranslatedItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [],
    });
    const requiredItem2 = createTranslatedItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [
            { id: requiredItem1.id, amount: 4 },
            { id: requiredItem2.id, amount: 6 },
        ],
    });

    beforeEach(() => {
        mockMongoDBQueryRequirements.mockResolvedValue([
            item,
            requiredItem1,
            requiredItem2,
        ]);
    });

    test.each([
        [
            OutputUnit.SECONDS,
            [
                {
                    id: item.id,
                    name: item.name,
                    amount: 7.5,
                    creators: [
                        {
                            id: item.id,
                            name: item.name,
                            creatorID: item.creatorID,
                            creator: item.creator,
                            amount: 7.5,
                            workers: 5,
                            demands: [
                                {
                                    id: requiredItem1.id,
                                    name: requiredItem1.name,
                                    amount: 10,
                                },
                                {
                                    id: requiredItem2.id,
                                    name: requiredItem2.name,
                                    amount: 15,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    amount: 10,
                    creators: [
                        {
                            id: requiredItem1.id,
                            creatorID: requiredItem1.creatorID,
                            name: requiredItem1.name,
                            creator: requiredItem1.creator,
                            amount: 10,
                            workers: 7.5,
                            demands: [],
                        },
                    ],
                },
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    amount: 15,
                    creators: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            creatorID: requiredItem2.creatorID,
                            creator: requiredItem2.creator,
                            amount: 15,
                            workers: 30,
                            demands: [],
                        },
                    ],
                },
            ],
        ],
        [
            OutputUnit.MINUTES,
            [
                {
                    id: item.id,
                    name: item.name,
                    amount: 450,
                    creators: [
                        {
                            id: item.id,
                            name: item.name,
                            creatorID: item.creatorID,
                            creator: item.creator,
                            amount: 450,
                            workers: 5,
                            demands: [
                                {
                                    id: requiredItem1.id,
                                    name: requiredItem1.name,
                                    amount: 600,
                                },
                                {
                                    id: requiredItem2.id,
                                    name: requiredItem2.name,
                                    amount: 900,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    amount: 600,
                    creators: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            creatorID: requiredItem1.creatorID,
                            creator: requiredItem1.creator,
                            amount: 600,
                            workers: 7.5,
                            demands: [],
                        },
                    ],
                },
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    amount: 900,
                    creators: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            creatorID: requiredItem2.creatorID,
                            creator: requiredItem2.creator,
                            amount: 900,
                            workers: 30,
                            demands: [],
                        },
                    ],
                },
            ],
        ],
        [
            OutputUnit.GAME_DAYS,
            [
                {
                    id: item.id,
                    name: item.name,
                    amount: 3262.5,
                    creators: [
                        {
                            id: item.id,
                            name: item.name,
                            creatorID: item.creatorID,
                            creator: item.creator,
                            amount: 3262.5,
                            workers: 5,
                            demands: [
                                {
                                    id: requiredItem1.id,
                                    name: requiredItem1.name,
                                    amount: 4350,
                                },
                                {
                                    id: requiredItem2.id,
                                    name: requiredItem2.name,
                                    amount: 6525,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    amount: 4350,
                    creators: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            creatorID: requiredItem1.creatorID,
                            creator: requiredItem1.creator,
                            amount: 4350,
                            workers: 7.5,
                            demands: [],
                        },
                    ],
                },
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    amount: 6525,
                    creators: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            creatorID: requiredItem2.creatorID,
                            creator: requiredItem2.creator,
                            amount: 6525,
                            workers: 30,
                            demands: [],
                        },
                    ],
                },
            ],
        ],
    ])(
        "returns requirement amounts in provided output given unit: %s",
        async (unit: OutputUnit, expected: Requirement[]) => {
            const actual = await queryRequirements({
                id: item.id,
                workers: validWorkers,
                unit,
            });

            expect(actual).toEqual(expected);
        },
    );
});

describe("handles machine tools", () => {
    const machineToolsItem = createTranslatedItemWithMachineTools({
        name: "machine tools item",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const baseItem = createTranslatedItem({
        name: "base item",
        createTime: 2,
        output: 6,
        requirements: [{ id: machineToolsItem.id, amount: 5 }],
    });
    const expectedRequiredToolsError = new Error(
        "Unable to create item with available tools, requires machine tools",
    );

    beforeEach(() => {
        mockMongoDBQueryRequirements.mockResolvedValue([
            baseItem,
            machineToolsItem,
        ]);
    });

    describe.each([
        ["specified", false],
        ["default", undefined],
    ])(
        "handles lacking machine tools (%s)",
        (_: string, hasMachineTools: boolean | undefined) => {
            test("throws an error when base item requires machine tools and they are not available", async () => {
                mockMongoDBQueryRequirements.mockResolvedValue([
                    machineToolsItem,
                ]);

                expect.assertions(1);
                await expect(
                    queryRequirements({
                        id: machineToolsItem.id,
                        workers: validWorkers,
                        ...(hasMachineTools ? { hasMachineTools } : {}),
                    }),
                ).rejects.toThrow(expectedRequiredToolsError);
            });

            test("throws an error when required item requires machine tools and they are not available", async () => {
                expect.assertions(1);
                await expect(
                    queryRequirements({
                        id: baseItem.id,
                        workers: validWorkers,
                        ...(hasMachineTools ? { hasMachineTools } : {}),
                    }),
                ).rejects.toThrow(expectedRequiredToolsError);
            });
        },
    );

    test("throws an error when machine tools are required and available but default toolset is not sufficient", async () => {
        const expectedError = `Unable to create item with available tools, minimum tool is: steel`;
        const baseItemSteelMin = createTranslatedItem({
            name: "base item",
            createTime: 3,
            output: 5,
            requirements: [{ id: machineToolsItem.id, amount: 5 }],
            minimumTool: "steel" as DefaultToolset,
            maximumTool: "steel" as DefaultToolset,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            baseItemSteelMin,
            machineToolsItem,
        ]);

        expect.assertions(1);
        await expect(
            queryRequirements({
                id: baseItem.id,
                workers: validWorkers,
                hasMachineTools: true,
                maxAvailableTool: "iron" as DefaultToolset,
            }),
        ).rejects.toThrow(expectedError);
    });

    test("returns expected requirements if machine tools are required and available", async () => {
        const actual = await queryRequirements({
            id: baseItem.id,
            workers: validWorkers,
            hasMachineTools: true,
        });

        expect(actual).toEqual([
            {
                id: baseItem.id,
                name: baseItem.name,
                amount: 15,
                creators: [
                    {
                        id: baseItem.id,
                        name: baseItem.name,
                        creatorID: baseItem.creatorID,
                        creator: baseItem.creator,
                        amount: 15,
                        workers: 5,
                        demands: [
                            {
                                id: machineToolsItem.id,
                                name: machineToolsItem.name,
                                amount: 12.5,
                            },
                        ],
                    },
                ],
            },
            {
                id: machineToolsItem.id,
                name: machineToolsItem.name,
                amount: 12.5,
                creators: [
                    {
                        id: machineToolsItem.id,
                        name: machineToolsItem.name,
                        creatorID: machineToolsItem.creatorID,
                        creator: machineToolsItem.creator,
                        amount: 12.5,
                        workers: 25,
                        demands: [],
                    },
                ],
            },
        ]);
    });
});

describe("handles calculating requirements for target output", () => {
    const targetAmount = 7.5;
    const requiredItem3 = createTranslatedItem({
        name: "required item 3",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem2 = createTranslatedItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem1 = createTranslatedItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [
            { id: requiredItem2.id, amount: 6 },
            { id: requiredItem3.id, amount: 4 },
        ],
    });
    const item = createTranslatedItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ id: requiredItem1.id, amount: 4 }],
    });

    beforeEach(() => {
        mockMongoDBQueryRequirements.mockResolvedValue([
            item,
            requiredItem1,
            requiredItem2,
            requiredItem3,
        ]);
    });

    test.each([
        ["equal to zero", 0],
        ["less than zero", -1],
    ])(
        "throws an error given target amount that is %s",
        async (_: string, amount: number) => {
            const expectedError = new Error(
                "Invalid target output provided, must be a positive number",
            );

            expect.assertions(1);
            await expect(
                queryRequirements({ id: item.id, amount }),
            ).rejects.toThrow(expectedError);
        },
    );

    test.each([
        [
            OutputUnit.SECONDS,
            [
                {
                    id: item.id,
                    name: item.name,
                    amount: targetAmount,
                    creators: [
                        {
                            id: item.id,
                            name: item.name,
                            creatorID: item.creatorID,
                            creator: item.creator,
                            amount: targetAmount,
                            workers: 5,
                            demands: [
                                {
                                    id: requiredItem1.id,
                                    name: requiredItem1.name,
                                    amount: 10,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    amount: 10,
                    creators: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            creatorID: requiredItem1.creatorID,
                            creator: requiredItem1.creator,
                            amount: 10,
                            workers: 7.5,
                            demands: [
                                {
                                    id: requiredItem2.id,
                                    name: requiredItem2.name,
                                    amount: 15,
                                },
                                {
                                    id: requiredItem3.id,
                                    name: requiredItem3.name,
                                    amount: 10,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    amount: 15,
                    creators: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            creatorID: requiredItem2.creatorID,
                            creator: requiredItem2.creator,
                            amount: 15,
                            workers: 30,
                            demands: [],
                        },
                    ],
                },
                {
                    id: requiredItem3.id,
                    name: requiredItem3.name,
                    amount: 10,
                    creators: [
                        {
                            id: requiredItem3.id,
                            name: requiredItem3.name,
                            creatorID: requiredItem3.creatorID,
                            creator: requiredItem3.creator,
                            amount: 10,
                            workers: 20,
                            demands: [],
                        },
                    ],
                },
            ],
        ],
        [
            OutputUnit.MINUTES,
            [
                {
                    id: item.id,
                    name: item.name,
                    amount: targetAmount,
                    creators: [
                        {
                            id: item.id,
                            name: item.name,
                            creatorID: item.creatorID,
                            creator: item.creator,
                            amount: targetAmount,
                            workers: 0.08333333,
                            demands: [
                                {
                                    id: requiredItem1.id,
                                    name: requiredItem1.name,
                                    amount: 10,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    amount: 10,
                    creators: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            creatorID: requiredItem1.creatorID,
                            creator: requiredItem1.creator,
                            amount: 10,
                            workers: 0.125,
                            demands: [
                                {
                                    id: requiredItem2.id,
                                    name: requiredItem2.name,
                                    amount: 15,
                                },
                                {
                                    id: requiredItem3.id,
                                    name: requiredItem3.name,
                                    amount: 10,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    amount: 15,
                    creators: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            creatorID: requiredItem2.creatorID,
                            creator: requiredItem2.creator,
                            amount: 15,
                            workers: 0.5,
                            demands: [],
                        },
                    ],
                },
                {
                    id: requiredItem3.id,
                    name: requiredItem3.name,
                    amount: 10,
                    creators: [
                        {
                            id: requiredItem3.id,
                            name: requiredItem3.name,
                            creatorID: requiredItem3.creatorID,
                            creator: requiredItem3.creator,
                            amount: 10,
                            workers: 0.33333333,
                            demands: [],
                        },
                    ],
                },
            ],
        ],
        [
            OutputUnit.GAME_DAYS,
            [
                {
                    id: item.id,
                    name: item.name,
                    amount: targetAmount,
                    creators: [
                        {
                            id: item.id,
                            name: item.name,
                            creatorID: item.creatorID,
                            creator: item.creator,
                            amount: targetAmount,
                            workers: 0.01149425,
                            demands: [
                                {
                                    id: requiredItem1.id,
                                    name: requiredItem1.name,
                                    amount: 10,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem1.id,
                    name: requiredItem1.name,
                    amount: 10,
                    creators: [
                        {
                            id: requiredItem1.id,
                            name: requiredItem1.name,
                            creatorID: requiredItem1.creatorID,
                            creator: requiredItem1.creator,
                            amount: 10,
                            workers: 0.01724138,
                            demands: [
                                {
                                    id: requiredItem2.id,
                                    name: requiredItem2.name,
                                    amount: 15,
                                },
                                {
                                    id: requiredItem3.id,
                                    name: requiredItem3.name,
                                    amount: 10,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: requiredItem2.id,
                    name: requiredItem2.name,
                    amount: 15,
                    creators: [
                        {
                            id: requiredItem2.id,
                            name: requiredItem2.name,
                            creatorID: requiredItem2.creatorID,
                            creator: requiredItem2.creator,
                            amount: 15,
                            workers: 0.06896552,
                            demands: [],
                        },
                    ],
                },
                {
                    id: requiredItem3.id,
                    name: requiredItem3.name,
                    amount: 10,
                    creators: [
                        {
                            id: requiredItem3.id,
                            name: requiredItem3.name,
                            creatorID: requiredItem3.creatorID,
                            creator: requiredItem3.creator,
                            amount: 10,
                            workers: 0.04597701,
                            demands: [],
                        },
                    ],
                },
            ],
        ],
    ])(
        "factors output unit into target amount when given non default %s",
        async (unit: OutputUnit, expected: Requirement[]) => {
            const actual = await queryRequirements({
                id: item.id,
                amount: targetAmount,
                unit,
            });

            expect(actual).toEqual(expected);
        },
    );
});

test("logs out requirements query to console", async () => {
    const storedItem = createTranslatedItem({
        name: validItemName,
        createTime: 1,
        output: 1,
        requirements: [],
    });
    const expectedParams: QueryRequirementsParams = {
        id: storedItem.id,
        maxAvailableTool: "copper" as DefaultToolset,
        hasMachineTools: true,
        unit: OutputUnit.GAME_DAYS,
        creatorOverrides: [
            { itemID: storedItem.id, creatorID: storedItem.creatorID },
        ],
        amount: 2,
    };
    mockMongoDBQueryRequirements.mockResolvedValue([storedItem]);

    await queryRequirements(expectedParams);

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith({
        key: "Requirements Input",
        parameters: JSON.stringify(expectedParams),
    });
});
