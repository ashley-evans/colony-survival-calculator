import { queryRequirements } from "../query-requirements";
import { queryRequirements as mongoDBQueryRequirements } from "../../adapters/mongodb-requirements-adapter";
import { createItem } from "../../../../../test";
import { Tools } from "../../../../types";
import {
    Demand,
    Requirement,
    RequirementRecipe,
} from "../../interfaces/query-requirements-primary-port";

jest.mock("../../adapters/mongodb-requirements-adapter", () => ({
    queryRequirements: jest.fn(),
}));

const mockMongoDBQueryRequirements = mongoDBQueryRequirements as jest.Mock;

const validItemName = "test item name";
const validWorkers = 5;

function findRequirement(
    requirements: Requirement[],
    itemName: string
): Requirement | undefined {
    return requirements.find((workers) => workers.name === itemName);
}

beforeEach(() => {
    mockMongoDBQueryRequirements.mockReset();
});

test("throws an error given an empty string as an item name", async () => {
    const expectedError = new Error(
        "Invalid item name provided, must be a non-empty string"
    );

    expect.assertions(1);
    await expect(
        queryRequirements({ name: "", workers: validWorkers })
    ).rejects.toThrow(expectedError);
});

test.each([
    ["equal to zero", 0],
    ["less than zero", -1],
])(
    "throws an error given number of workers that is %s",
    async (_: string, amount: number) => {
        const expectedError = new Error(
            "Invalid number of workers provided, must be a positive number"
        );

        expect.assertions(1);
        await expect(
            queryRequirements({ name: validItemName, workers: amount })
        ).rejects.toThrow(expectedError);
    }
);

test("calls the database adapter to get the requirements given valid input", async () => {
    const item = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item]);

    await queryRequirements({ name: validItemName, workers: validWorkers });

    expect(mockMongoDBQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockMongoDBQueryRequirements).toHaveBeenCalledWith(validItemName);
});

test("throws an error if no requirements are returned at all (item does not exist)", async () => {
    mockMongoDBQueryRequirements.mockResolvedValue([]);
    const expectedError = new Error("Unknown item provided");

    expect.assertions(1);
    await expect(
        queryRequirements({ name: validItemName, workers: validWorkers })
    ).rejects.toThrow(expectedError);
});

test("throws an error if the provided item details are not returned from DB", async () => {
    const item = createItem({
        name: "another item",
        createTime: 2,
        output: 3,
        requirements: [],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item]);
    const expectedError = new Error("Unknown item provided");

    expect.assertions(1);
    await expect(
        queryRequirements({ name: validItemName, workers: validWorkers })
    ).rejects.toThrow(expectedError);
});

test("returns an empty array if the provided item has no requirements", async () => {
    const item = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item]);

    const actual = await queryRequirements({
        name: validItemName,
        workers: validWorkers,
    });

    expect(actual).toEqual([]);
});

test("throws an error if provided item requires an item that does not exist in database", async () => {
    const item = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ name: "unknown item", amount: 4 }],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item]);
    const expectedError = new Error("Internal server error");

    expect.assertions(1);
    await expect(
        queryRequirements({ name: validItemName, workers: validWorkers })
    ).rejects.toThrow(expectedError);
});

test("returns requirement given item with a single requirement and no nested requirements", async () => {
    const requiredItem = createItem({
        name: "required item",
        createTime: 3,
        output: 4,
        requirements: [],
    });
    const item = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ name: requiredItem.name, amount: 4 }],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

    const actual = await queryRequirements({
        name: validItemName,
        workers: validWorkers,
    });

    // Check overall item requirement
    expect(actual).toHaveLength(1);
    const requirement = actual[0] as Requirement;

    expect(requirement.name).toEqual(requiredItem.name);
    expect(requirement.amount).toBeCloseTo(10);

    // Check creator requirement
    expect(requirement.creators).toHaveLength(1);
    const creator = requirement.creators[0] as RequirementRecipe;

    expect(creator.name).toEqual(requiredItem.name);
    expect(creator.creator).toEqual(requiredItem.creator);
    expect(creator.workers).toBeCloseTo(7.5);

    // Check specific creator demands
    expect(creator.demands).toEqual([]);
});

test("returns requirements given item with multiple requirements and no nested requirements", async () => {
    const requiredItem1 = createItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [],
    });
    const requiredItem2 = createItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const item = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [
            { name: requiredItem1.name, amount: 4 },
            { name: requiredItem2.name, amount: 6 },
        ],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
    ]);

    const actual = await queryRequirements({
        name: validItemName,
        workers: validWorkers,
    });

    // Check overall item requirement
    expect(actual).toHaveLength(2);
    const requirement1 = actual[0] as Requirement;

    expect(requirement1.name).toEqual(requiredItem1.name);
    expect(requirement1.amount).toBeCloseTo(10);

    // Check creator requirement
    expect(requirement1.creators).toHaveLength(1);
    const requirement1Creator = requirement1.creators[0] as RequirementRecipe;

    expect(requirement1Creator.name).toEqual(requiredItem1.name);
    expect(requirement1Creator.creator).toEqual(requiredItem1.creator);
    expect(requirement1Creator.workers).toBeCloseTo(7.5);

    // Check specific creator demands
    expect(requirement1Creator.demands).toEqual([]);

    // Check overall item requirement
    const requirement2 = actual[1] as Requirement;

    expect(requirement2.name).toEqual(requiredItem2.name);
    expect(requirement2.amount).toBeCloseTo(15);

    // Check creator requirement
    expect(requirement2.creators).toHaveLength(1);
    const requirement2Creator = requirement2.creators[0] as RequirementRecipe;

    expect(requirement2Creator.name).toEqual(requiredItem2.name);
    expect(requirement2Creator.creator).toEqual(requiredItem2.creator);
    expect(requirement2Creator.workers).toBeCloseTo(30);

    // Check specific creator demands
    expect(requirement2Creator.demands).toEqual([]);
});

test("returns requirements given item with single nested requirement", async () => {
    const requiredItem2 = createItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem1 = createItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [{ name: requiredItem2.name, amount: 6 }],
    });
    const item = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ name: requiredItem1.name, amount: 4 }],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
    ]);

    const actual = await queryRequirements({
        name: validItemName,
        workers: validWorkers,
    });

    // Check overall item requirement
    expect(actual).toHaveLength(2);
    const requirement1 = actual[0] as Requirement;

    expect(requirement1.name).toEqual(requiredItem1.name);
    expect(requirement1.amount).toBeCloseTo(10);

    // Check creator requirement
    expect(requirement1.creators).toHaveLength(1);
    const requirement1Creator = requirement1.creators[0] as RequirementRecipe;

    expect(requirement1Creator.name).toEqual(requiredItem1.name);
    expect(requirement1Creator.creator).toEqual(requiredItem1.creator);
    expect(requirement1Creator.workers).toBeCloseTo(7.5);

    // Check specific creator demands
    expect(requirement1Creator.demands).toHaveLength(1);
    const requirement1CreatorDemands = requirement1Creator.demands[0] as Demand;

    expect(requirement1CreatorDemands.name).toEqual(requiredItem2.name);
    expect(requirement1CreatorDemands.amount).toEqual(15);

    // Check overall item requirement
    const requirement2 = actual[1] as Requirement;

    expect(requirement2.name).toEqual(requiredItem2.name);
    expect(requirement2.amount).toBeCloseTo(15);

    // Check creator requirement
    expect(requirement2.creators).toHaveLength(1);
    const requirement2Creator = requirement2.creators[0] as RequirementRecipe;

    expect(requirement2Creator.name).toEqual(requiredItem2.name);
    expect(requirement2Creator.creator).toEqual(requiredItem2.creator);
    expect(requirement2Creator.workers).toBeCloseTo(30);

    // Check specific creator demands
    expect(requirement2Creator.demands).toEqual([]);
});

test("returns requirements given item with multiple different nested requirements", async () => {
    const requiredItem3 = createItem({
        name: "required item 3",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem2 = createItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem1 = createItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [
            { name: requiredItem2.name, amount: 6 },
            { name: requiredItem3.name, amount: 4 },
        ],
    });
    const item = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [{ name: requiredItem1.name, amount: 4 }],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
        requiredItem3,
    ]);

    const actual = await queryRequirements({
        name: validItemName,
        workers: validWorkers,
    });

    // Check overall item requirement
    expect(actual).toHaveLength(3);
    const requirement1 = actual[0] as Requirement;

    expect(requirement1.name).toEqual(requiredItem1.name);
    expect(requirement1.amount).toBeCloseTo(10);

    // Check creator requirement
    expect(requirement1.creators).toHaveLength(1);
    const requirement1Creator = requirement1.creators[0] as RequirementRecipe;

    expect(requirement1Creator.name).toEqual(requiredItem1.name);
    expect(requirement1Creator.creator).toEqual(requiredItem1.creator);
    expect(requirement1Creator.workers).toBeCloseTo(7.5);

    // Check specific creator demands
    expect(requirement1Creator.demands).toHaveLength(2);
    const requirement1CreatorDemands1 = requirement1Creator
        .demands[0] as Demand;

    expect(requirement1CreatorDemands1.name).toEqual(requiredItem2.name);
    expect(requirement1CreatorDemands1.amount).toEqual(15);

    const requirement1CreatorDemands2 = requirement1Creator
        .demands[1] as Demand;

    expect(requirement1CreatorDemands2.name).toEqual(requiredItem3.name);
    expect(requirement1CreatorDemands2.amount).toEqual(10);

    // Check overall item requirement
    const requirement2 = actual[1] as Requirement;

    expect(requirement2.name).toEqual(requiredItem2.name);
    expect(requirement2.amount).toBeCloseTo(15);

    // Check creator requirement
    expect(requirement2.creators).toHaveLength(1);
    const requirement2Creator = requirement2.creators[0] as RequirementRecipe;

    expect(requirement2Creator.name).toEqual(requiredItem2.name);
    expect(requirement2Creator.creator).toEqual(requiredItem2.creator);
    expect(requirement2Creator.workers).toBeCloseTo(30);

    // Check specific creator demands
    expect(requirement2Creator.demands).toEqual([]);

    // Check overall item requirement
    const requirement3 = actual[2] as Requirement;

    expect(requirement3.name).toEqual(requiredItem3.name);
    expect(requirement3.amount).toBeCloseTo(10);

    // Check creator requirement
    expect(requirement3.creators).toHaveLength(1);
    const requirement3Creator = requirement3.creators[0] as RequirementRecipe;

    expect(requirement3Creator.name).toEqual(requiredItem3.name);
    expect(requirement3Creator.creator).toEqual(requiredItem3.creator);
    expect(requirement3Creator.workers).toBeCloseTo(20);

    // Check specific creator demands
    expect(requirement3Creator.demands).toEqual([]);
});

test("returns combined requirements given item with multiple nested requirements with common requirement", async () => {
    const requiredItem3 = createItem({
        name: "required item 3",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem2 = createItem({
        name: "required item 2",
        createTime: 4,
        output: 2,
        requirements: [],
    });
    const requiredItem1 = createItem({
        name: "required item 1",
        createTime: 3,
        output: 4,
        requirements: [
            { name: requiredItem2.name, amount: 6 },
            { name: requiredItem3.name, amount: 4 },
        ],
    });
    const item = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [
            { name: requiredItem1.name, amount: 4 },
            { name: requiredItem3.name, amount: 2 },
        ],
    });
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
        requiredItem3,
    ]);

    const actual = await queryRequirements({
        name: validItemName,
        workers: validWorkers,
    });

    // Check overall item requirement
    expect(actual).toHaveLength(3);
    const requirement1 = actual[0] as Requirement;

    expect(requirement1.name).toEqual(requiredItem1.name);
    expect(requirement1.amount).toBeCloseTo(10);

    // Check creator requirement
    expect(requirement1.creators).toHaveLength(1);
    const requirement1Creator = requirement1.creators[0] as RequirementRecipe;

    expect(requirement1Creator.name).toEqual(requiredItem1.name);
    expect(requirement1Creator.creator).toEqual(requiredItem1.creator);
    expect(requirement1Creator.workers).toBeCloseTo(7.5);

    // Check specific creator demands
    expect(requirement1Creator.demands).toHaveLength(2);
    const requirement1CreatorDemands1 = requirement1Creator
        .demands[0] as Demand;

    expect(requirement1CreatorDemands1.name).toEqual(requiredItem2.name);
    expect(requirement1CreatorDemands1.amount).toEqual(15);

    const requirement1CreatorDemands2 = requirement1Creator
        .demands[1] as Demand;

    expect(requirement1CreatorDemands2.name).toEqual(requiredItem3.name);
    expect(requirement1CreatorDemands2.amount).toEqual(10);

    // Check overall item requirement
    const requirement2 = actual[1] as Requirement;

    expect(requirement2.name).toEqual(requiredItem3.name);
    expect(requirement2.amount).toBeCloseTo(15);

    // Check creator requirement
    expect(requirement2.creators).toHaveLength(1);
    const requirement2Creator = requirement2.creators[0] as RequirementRecipe;

    expect(requirement2Creator.name).toEqual(requiredItem3.name);
    expect(requirement2Creator.creator).toEqual(requiredItem3.creator);
    expect(requirement2Creator.workers).toBeCloseTo(30);

    // Check specific creator demands
    expect(requirement2Creator.demands).toEqual([]);

    // Check overall item requirement
    const requirement3 = actual[2] as Requirement;

    expect(requirement3.name).toEqual(requiredItem2.name);
    expect(requirement3.amount).toBeCloseTo(15);

    // Check creator requirement
    expect(requirement3.creators).toHaveLength(1);
    const requirement3Creator = requirement3.creators[0] as RequirementRecipe;

    expect(requirement3Creator.name).toEqual(requiredItem2.name);
    expect(requirement3Creator.creator).toEqual(requiredItem2.creator);
    expect(requirement3Creator.workers).toBeCloseTo(30);

    // Check specific creator demands
    expect(requirement3Creator.demands).toEqual([]);
});

test("throws an error if an unhandled exception occurs while fetching item requirements", async () => {
    mockMongoDBQueryRequirements.mockRejectedValue(new Error("unhandled"));
    const expectedError = new Error("Internal server error");

    expect.assertions(1);
    await expect(
        queryRequirements({ name: validItemName, workers: validWorkers })
    ).rejects.toThrow(expectedError);
});

describe("handles tool modifiers", () => {
    test.each([
        ["stone min, none provided", Tools.stone, Tools.none],
        ["copper min, stone provided", Tools.copper, Tools.stone],
        ["iron min, copper provided", Tools.iron, Tools.copper],
        ["bronze min, iron provided", Tools.bronze, Tools.iron],
        ["steel min, bronze provided", Tools.steel, Tools.bronze],
    ])(
        "throws an error if the provided tool is less the minimum requirement for the specified item (%s)",
        async (_: string, minimum: Tools, provided: Tools) => {
            const item = createItem({
                name: validItemName,
                createTime: 2,
                output: 3,
                requirements: [],
                minimumTool: minimum,
                maximumTool: Tools.steel,
            });
            mockMongoDBQueryRequirements.mockResolvedValue([item]);
            const expectedError = `Unable to create item with available tools, minimum tool is: ${minimum.toLowerCase()}`;

            expect.assertions(1);
            await expect(
                queryRequirements({
                    name: validItemName,
                    workers: validWorkers,
                    maxAvailableTool: provided,
                })
            ).rejects.toThrow(expectedError);
        }
    );

    test.each([
        ["stone min, none provided", Tools.stone, Tools.none],
        ["copper min, stone provided", Tools.copper, Tools.stone],
        ["iron min, copper provided", Tools.iron, Tools.copper],
        ["bronze min, iron provided", Tools.bronze, Tools.iron],
        ["steel min, bronze provided", Tools.steel, Tools.bronze],
    ])(
        "throws an error if the provided tool is less the minimum requirement for any item's requirements (%s)",
        async (_: string, minimum: Tools, provided: Tools) => {
            const requiredItem = createItem({
                name: "another item",
                createTime: 2,
                output: 3,
                requirements: [],
                minimumTool: minimum,
                maximumTool: Tools.steel,
            });
            const item = createItem({
                name: validItemName,
                createTime: 2,
                output: 3,
                requirements: [{ name: requiredItem.name, amount: 3 }],
                minimumTool: Tools.none,
                maximumTool: Tools.steel,
            });
            mockMongoDBQueryRequirements.mockResolvedValue([
                item,
                requiredItem,
            ]);
            const expectedError = `Unable to create item with available tools, minimum tool is: ${minimum.toLowerCase()}`;

            expect.assertions(1);
            await expect(
                queryRequirements({
                    name: validItemName,
                    workers: validWorkers,
                    maxAvailableTool: provided,
                })
            ).rejects.toThrow(expectedError);
        }
    );

    test("throws an error with lowest required tool in message given multiple items w/ unmet tool requirements", async () => {
        const expectedMinimumTool = Tools.iron;
        const requiredItem = createItem({
            name: "another item",
            createTime: 2,
            output: 3,
            requirements: [],
            minimumTool: Tools.stone,
            maximumTool: Tools.steel,
        });
        const item = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 3 }],
            minimumTool: Tools.iron,
            maximumTool: Tools.steel,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([requiredItem, item]);
        const expectedError = `Unable to create item with available tools, minimum tool is: ${expectedMinimumTool}`;

        expect.assertions(1);
        await expect(
            queryRequirements({ name: validItemName, workers: validWorkers })
        ).rejects.toThrow(expectedError);
    });

    test.each([
        [Tools.none, 7.5, 5],
        [Tools.stone, 15, 10],
        [Tools.copper, 30, 20],
        [Tools.iron, 39.75, 26.5],
        [Tools.bronze, 46.125, 30.75],
        [Tools.steel, 60, 40],
    ])(
        "returns expected output for requirement given item with applicable tool: %s and requirement with no tools",
        async (
            provided: Tools,
            expectedOutput: number,
            expectedWorkers: number
        ) => {
            const requiredItemName = "another item";
            const requiredItem = createItem({
                name: requiredItemName,
                createTime: 2,
                output: 3,
                requirements: [],
                minimumTool: Tools.none,
                maximumTool: Tools.none,
            });
            const item = createItem({
                name: validItemName,
                createTime: 2,
                output: 3,
                requirements: [{ name: requiredItem.name, amount: 3 }],
                minimumTool: Tools.none,
                maximumTool: Tools.steel,
            });
            mockMongoDBQueryRequirements.mockResolvedValue([
                item,
                requiredItem,
            ]);

            const actual = await queryRequirements({
                name: validItemName,
                workers: validWorkers,
                maxAvailableTool: provided,
            });
            const requirement = findRequirement(
                actual,
                requiredItemName
            ) as Requirement;

            expect(requirement.amount).toBeCloseTo(expectedOutput);
            expect(requirement.creators[0]?.workers).toBeCloseTo(
                expectedWorkers
            );
        }
    );

    test("returns required output/workers to satisfy input item given tool better than applicable to input item", async () => {
        const requiredItemName = "another item";
        const requiredItem = createItem({
            name: requiredItemName,
            createTime: 2,
            output: 3,
            requirements: [],
            minimumTool: Tools.none,
            maximumTool: Tools.none,
        });
        const item = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 3 }],
            minimumTool: Tools.none,
            maximumTool: Tools.copper,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            maxAvailableTool: Tools.steel,
        });
        const requirement = findRequirement(
            actual,
            requiredItemName
        ) as Requirement;

        expect(requirement.amount).toBeCloseTo(30);
        expect(requirement.creators[0]?.workers).toBeCloseTo(20);
    });

    test("reduces required workers for requirement if tool provided is applicable to requirement and not input item", async () => {
        const requiredItemName = "another item";
        const requiredItem = createItem({
            name: requiredItemName,
            createTime: 2,
            output: 3,
            requirements: [],
            minimumTool: Tools.none,
            maximumTool: Tools.steel,
        });
        const item = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 3 }],
            minimumTool: Tools.none,
            maximumTool: Tools.none,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            maxAvailableTool: Tools.steel,
        });
        const requirement = findRequirement(
            actual,
            requiredItemName
        ) as Requirement;

        expect(requirement.creators[0]?.workers).toBeCloseTo(0.625);
    });

    test("reduces required workers for required item to max applicable to requirement given better tool applicable to only requirement", async () => {
        const requiredItemName = "another item";
        const requiredItem = createItem({
            name: requiredItemName,
            createTime: 2,
            output: 3,
            requirements: [],
            minimumTool: Tools.none,
            maximumTool: Tools.copper,
        });
        const item = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 3 }],
            minimumTool: Tools.none,
            maximumTool: Tools.none,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            maxAvailableTool: Tools.steel,
        });
        const requirement = findRequirement(
            actual,
            requiredItemName
        ) as Requirement;

        expect(requirement.creators[0]?.workers).toBeCloseTo(1.25);
    });
});

describe("optional output requirement impact", () => {
    test("factors optional output given item with single requirement that is also optional output", async () => {
        const requiredItem = createItem({
            name: "required item 1",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const item = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 2 }],
            optionalOutputs: [
                { name: requiredItem.name, amount: 1, likelihood: 0.5 },
            ],
        });
        mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requiredItem.name);
        expect(requirement.amount).toBeCloseTo(5);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(2);
        const creator1 = requirement.creators[0] as RequirementRecipe;

        expect(creator1.name).toEqual(item.name);
        expect(creator1.creator).toEqual(item.creator);
        expect(creator1.workers).toBeCloseTo(5);

        // Check specific creator demands
        expect(creator1.demands).toEqual([]);

        // Check creator requirement
        const creator2 = requirement.creators[1] as RequirementRecipe;

        expect(creator2.name).toEqual(requiredItem.name);
        expect(creator2.creator).toEqual(requiredItem.creator);
        expect(creator2.workers).toBeCloseTo(2.8125);

        // Check specific creator demands
        expect(creator2.demands).toEqual([]);
    });

    test("factors optional output given item with nested requirement that is top level optional output", async () => {
        const requiredItem2 = createItem({
            name: "required item 2",
            createTime: 4,
            output: 2,
            requirements: [],
        });
        const requiredItem1 = createItem({
            name: "required item 1",
            createTime: 3,
            output: 4,
            requirements: [{ name: requiredItem2.name, amount: 6 }],
        });
        const item = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem1.name, amount: 4 }],
            optionalOutputs: [
                { name: requiredItem2.name, amount: 2, likelihood: 0.5 },
            ],
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            item,
            requiredItem1,
            requiredItem2,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
        });

        // Check overall item requirement
        expect(actual).toHaveLength(2);
        const requirement1 = actual[0] as Requirement;

        expect(requirement1.name).toEqual(requiredItem1.name);
        expect(requirement1.amount).toBeCloseTo(10);

        // Check creator requirement
        expect(requirement1.creators).toHaveLength(1);
        const requirement1Creator = requirement1
            .creators[0] as RequirementRecipe;

        expect(requirement1Creator.name).toEqual(requiredItem1.name);
        expect(requirement1Creator.creator).toEqual(requiredItem1.creator);
        expect(requirement1Creator.workers).toBeCloseTo(7.5);

        // Check specific creator demands
        expect(requirement1Creator.demands).toHaveLength(1);
        const requirement1CreatorDemands = requirement1Creator
            .demands[0] as Demand;

        expect(requirement1CreatorDemands.name).toEqual(requiredItem2.name);
        expect(requirement1CreatorDemands.amount).toEqual(15);

        // Check overall item requirement
        const requirement2 = actual[1] as Requirement;

        expect(requirement2.name).toEqual(requiredItem2.name);
        expect(requirement2.amount).toBeCloseTo(15);

        // Check creator requirement
        expect(requirement2.creators).toHaveLength(2);
        const requirement2Creator1 = requirement2
            .creators[0] as RequirementRecipe;

        expect(requirement2Creator1.name).toEqual(item.name);
        expect(requirement2Creator1.creator).toEqual(item.creator);
        expect(requirement2Creator1.workers).toBeCloseTo(5);

        // Check specific creator demands
        expect(requirement2Creator1.demands).toEqual([]);

        // Check creator requirement
        const requirement2Creator2 = requirement2
            .creators[1] as RequirementRecipe;

        expect(requirement2Creator2.name).toEqual(requiredItem2.name);
        expect(requirement2Creator2.creator).toEqual(requiredItem2.creator);
        expect(requirement2Creator2.workers).toBeCloseTo(25);

        // Check specific creator demands
        expect(requirement2Creator2.demands).toEqual([]);
    });

    test("uses recipe with high optional output over lower base output", async () => {
        const requirementName = "required item";
        const higherBaseRecipe = createItem({
            name: requirementName,
            createTime: 3,
            output: 4,
            requirements: [],
            creator: "creator 1",
        });
        const higherOptionalOutputRecipe = createItem({
            name: requirementName,
            createTime: 3,
            output: 1,
            requirements: [],
            optionalOutputs: [
                { name: requirementName, amount: 4, likelihood: 1 },
            ],
            creator: "creator 2",
        });
        const item = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requirementName, amount: 2 }],
            optionalOutputs: [],
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            item,
            higherBaseRecipe,
            higherOptionalOutputRecipe,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requirementName);
        expect(requirement.amount).toBeCloseTo(5);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(requirementName);
        expect(creator.creator).toEqual(higherOptionalOutputRecipe.creator);
        expect(creator.workers).toBeCloseTo(3);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });
});

describe("multiple recipe handling", () => {
    test("uses the recipe with most output when an item has more than one creator", async () => {
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 1",
        });
        const moreOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requiredItem.name);
        expect(requirement.amount).toBeCloseTo(20);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(requiredItem.name);
        expect(creator.creator).toEqual(requiredItem.creator);
        expect(creator.workers).toBeCloseTo(15);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });

    test("factors max available tool into most output calculation when given item w/ lower base output but higher modified", async () => {
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 1",
            maximumTool: Tools.stone,
        });
        const moreOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 2",
            maximumTool: Tools.steel,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            maxAvailableTool: Tools.steel,
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requiredItem.name);
        expect(requirement.amount).toBeCloseTo(80);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(requiredItem.name);
        expect(creator.creator).toEqual(requiredItem.creator);
        expect(creator.workers).toBeCloseTo(60);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });

    test("ignores more optimal recipe if cannot be created by provided max tool", async () => {
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 1",
            maximumTool: Tools.stone,
        });
        const moreOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 6,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 2",
            minimumTool: Tools.steel,
            maximumTool: Tools.steel,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requiredItem.name);
        expect(requirement.amount).toBeCloseTo(10);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(requiredItem.name);
        expect(creator.creator).toEqual(requiredItem.creator);
        expect(creator.workers).toBeCloseTo(7.5);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });

    test("does not return any required items if the required item was related to a sub optimal recipe", async () => {
        const moreOptimalRequiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalRequiredItem = createItem({
            name: "another required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: lessOptimalRequiredItem.name, amount: 4 }],
            creator: "creator 1",
        });
        const moreOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 6,
            requirements: [{ name: moreOptimalRequiredItem.name, amount: 4 }],
            creator: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            moreOptimalRequiredItem,
            lessOptimalRequiredItem,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(moreOptimalRequiredItem.name);
        expect(requirement.amount).toBeCloseTo(20);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(moreOptimalRequiredItem.name);
        expect(creator.creator).toEqual(moreOptimalRequiredItem.creator);
        expect(creator.workers).toBeCloseTo(15);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });

    test("throws an error if an item cannot be created by any recipe w/ provided tools", async () => {
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 1",
            maximumTool: Tools.stone,
            minimumTool: Tools.stone,
        });
        const moreOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 6,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 2",
            minimumTool: Tools.steel,
            maximumTool: Tools.steel,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);
        const expectedError = `Unable to create item with available tools, minimum tool is: ${Tools.stone}`;

        expect.assertions(1);
        await expect(
            queryRequirements({ name: validItemName, workers: validWorkers })
        ).rejects.toThrow(expectedError);
    });
});

describe("creator override handling", () => {
    test("overrides more optimal recipe when given applicable item override", async () => {
        const overrideCreator = "override creator";
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: overrideCreator,
        });
        const moreOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            creatorOverrides: [
                { itemName: validItemName, creator: overrideCreator },
            ],
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requiredItem.name);
        expect(requirement.amount).toBeCloseTo(10);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(requiredItem.name);
        expect(creator.creator).toEqual(requiredItem.creator);
        expect(creator.workers).toBeCloseTo(7.5);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });

    test("favours less optimal requirement recipe given applicable requirement override", async () => {
        const requiredItemName = "required item";
        const overrideCreator = "override creator";
        const moreOptimalRequirementRecipe = createItem({
            name: requiredItemName,
            createTime: 1,
            output: 4,
            requirements: [],
        });
        const lessOptimalRequirementRecipe = createItem({
            name: requiredItemName,
            createTime: 3,
            output: 4,
            requirements: [],
            creator: overrideCreator,
        });
        const recipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItemName, amount: 4 }],
            creator: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            recipe,
            moreOptimalRequirementRecipe,
            lessOptimalRequirementRecipe,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            creatorOverrides: [
                { itemName: requiredItemName, creator: overrideCreator },
            ],
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requiredItemName);
        expect(requirement.amount).toBeCloseTo(20);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(requiredItemName);
        expect(creator.creator).toEqual(overrideCreator);
        expect(creator.workers).toBeCloseTo(15);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });

    test("throws an error if provided more than one override for a single item", async () => {
        const overrideCreator = "override creator";
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const recipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: overrideCreator,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([recipe, requiredItem]);
        const expectedError = `Invalid input: More than one creator override provided for: ${validItemName}`;

        expect.assertions(1);
        await expect(
            queryRequirements({
                name: validItemName,
                workers: validWorkers,
                creatorOverrides: [
                    { itemName: validItemName, creator: overrideCreator },
                    { itemName: validItemName, creator: "another creator" },
                ],
            })
        ).rejects.toThrow(expectedError);
    });

    test("ignores any provided override that is irrelevant to calculating requirements", async () => {
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
        });
        const moreOptimalItemRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            lessOptimalItemRecipe,
            moreOptimalItemRecipe,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            creatorOverrides: [
                { itemName: "another item", creator: "another item creator" },
            ],
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requiredItem.name);
        expect(requirement.amount).toBeCloseTo(20);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(requiredItem.name);
        expect(creator.creator).toEqual(requiredItem.creator);
        expect(creator.workers).toBeCloseTo(15);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });

    test("does not return any requirement that relates to a recipe that was removed by an override", async () => {
        const override = "test override creator";
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const overriddenRequirement = createItem({
            name: "overridden item requirement",
            createTime: 2,
            output: 1,
            requirements: [],
        });
        const removedItemRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: overriddenRequirement.name, amount: 4 }],
        });
        const usedRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: override,
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            usedRecipe,
            removedItemRecipe,
            overriddenRequirement,
            requiredItem,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            creatorOverrides: [{ itemName: validItemName, creator: override }],
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(requiredItem.name);
        expect(requirement.amount).toBeCloseTo(20);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(requiredItem.name);
        expect(creator.creator).toEqual(requiredItem.creator);
        expect(creator.workers).toBeCloseTo(15);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });

    test("throws an error if the provided override would result in no recipe being known for a given item (root override)", async () => {
        const override = "another creator";
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const recipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "test creator",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([recipe, requiredItem]);
        const expectedError =
            "Invalid input, item is not creatable with current overrides";

        expect.assertions(1);
        await expect(
            queryRequirements({
                name: validItemName,
                workers: validWorkers,
                creatorOverrides: [
                    { itemName: validItemName, creator: override },
                ],
            })
        ).rejects.toThrow(expectedError);
    });

    test("throws an error if the provided override would result in no recipe being known for a given item (requirement override)", async () => {
        const override = "another creator";
        const requiredItem = createItem({
            name: "required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const recipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [{ name: requiredItem.name, amount: 4 }],
            creator: "test creator",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([recipe, requiredItem]);
        const expectedError =
            "Invalid input, item is not creatable with current overrides";

        expect.assertions(1);
        await expect(
            queryRequirements({
                name: validItemName,
                workers: validWorkers,
                creatorOverrides: [
                    { itemName: requiredItem.name, creator: override },
                ],
            })
        ).rejects.toThrow(expectedError);
    });

    test("does not return any requirement related to optimal but un-creatable recipes if override removes requirement", async () => {
        const lessOptimalRecipeRequirement = createItem({
            name: "less optimal item requirement",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const moreOptimalRecipeRequirement = createItem({
            name: "more optimal required item",
            createTime: 3,
            output: 4,
            requirements: [],
        });
        const lessOptimalRecipe = createItem({
            name: validItemName,
            createTime: 2,
            output: 3,
            requirements: [
                { name: lessOptimalRecipeRequirement.name, amount: 4 },
            ],
            creator: "creator 1",
        });
        const moreOptimalRecipe = createItem({
            name: validItemName,
            createTime: 1,
            output: 3,
            requirements: [
                { name: moreOptimalRecipeRequirement.name, amount: 4 },
            ],
            creator: "creator 2",
        });
        mockMongoDBQueryRequirements.mockResolvedValue([
            moreOptimalRecipe,
            lessOptimalRecipe,
            moreOptimalRecipeRequirement,
            lessOptimalRecipeRequirement,
        ]);

        const actual = await queryRequirements({
            name: validItemName,
            workers: validWorkers,
            creatorOverrides: [
                {
                    itemName: moreOptimalRecipeRequirement.name,
                    creator: "unknown creator",
                },
            ],
        });

        // Check overall item requirement
        expect(actual).toHaveLength(1);
        const requirement = actual[0] as Requirement;

        expect(requirement.name).toEqual(lessOptimalRecipeRequirement.name);
        expect(requirement.amount).toBeCloseTo(10);

        // Check creator requirement
        expect(requirement.creators).toHaveLength(1);
        const creator = requirement.creators[0] as RequirementRecipe;

        expect(creator.name).toEqual(lessOptimalRecipeRequirement.name);
        expect(creator.creator).toEqual(lessOptimalRecipeRequirement.creator);
        expect(creator.workers).toBeCloseTo(7.5);

        // Check specific creator demands
        expect(creator.demands).toEqual([]);
    });
});
