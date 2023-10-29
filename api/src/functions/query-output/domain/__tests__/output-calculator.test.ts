import { calculateOutput } from "../output-calculator";
import { queryOutputDetails } from "../../adapters/mongodb-output-adapter";
import type { ItemOutputDetails } from "../../interfaces/output-database-port";
import { DefaultToolset, MachineToolset, Toolset } from "../../../../types";
import { OutputUnit } from "../../../../common";

jest.mock("../../adapters/mongodb-output-adapter", () => ({
    queryOutputDetails: jest.fn(),
}));

const mockQueryOutputDetails = queryOutputDetails as jest.Mock;

function createItemOutputDetails(
    createTime: number,
    output: number,
    toolset: Toolset = {
        type: "default",
        minimumTool: DefaultToolset.none,
        maximumTool: DefaultToolset.none,
    }
): ItemOutputDetails {
    return {
        createTime,
        output,
        toolset,
    };
}

const validItemName = "test item name";
const validWorkers = 5;

beforeEach(() => {
    mockQueryOutputDetails.mockReset();
});

test("throws an error given an empty string as an item name", async () => {
    const expectedError = new Error(
        "Invalid item name provided, must be a non-empty string"
    );

    expect.assertions(1);
    await expect(
        calculateOutput({
            name: "",
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
        })
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
            calculateOutput({
                name: validItemName,
                workers: amount,
                unit: OutputUnit.MINUTES,
            })
        ).rejects.toThrow(expectedError);
    }
);

test("calls the database adapter to get the output details for the provided item", async () => {
    const details = createItemOutputDetails(2, 3);
    mockQueryOutputDetails.mockResolvedValue([details]);

    await calculateOutput({
        name: validItemName,
        workers: validWorkers,
        unit: OutputUnit.MINUTES,
    });

    expect(mockQueryOutputDetails).toHaveBeenCalledTimes(1);
    expect(mockQueryOutputDetails).toHaveBeenCalledWith({
        name: validItemName,
    });
});

test("provides the creator name to database adapter if provided", async () => {
    const expectedCreatorName = "test creator";
    const details = createItemOutputDetails(2, 3);
    mockQueryOutputDetails.mockResolvedValue([details]);

    await calculateOutput({
        name: validItemName,
        workers: validWorkers,
        unit: OutputUnit.MINUTES,
        creator: expectedCreatorName,
    });

    expect(mockQueryOutputDetails).toHaveBeenCalledTimes(1);
    expect(mockQueryOutputDetails).toHaveBeenCalledWith({
        name: validItemName,
        creator: expectedCreatorName,
    });
});

test("throws an error if no item output details are returned from DB", async () => {
    mockQueryOutputDetails.mockResolvedValue([]);
    const expectedError = new Error("Unknown item provided");

    expect.assertions(1);
    await expect(
        calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
        })
    ).rejects.toThrow(expectedError);
});

test("throws an error if an unhandled exception occurs while fetching item requirements", async () => {
    mockQueryOutputDetails.mockRejectedValue(new Error("unhandled"));
    const expectedError = new Error("Internal server error");

    expect.assertions(1);
    await expect(
        calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
        })
    ).rejects.toThrow(expectedError);
});

test.each([
    [OutputUnit.GAME_DAYS, 2, 3, 3262.5],
    [OutputUnit.MINUTES, 2, 3, 450],
    [OutputUnit.SECONDS, 2, 3, 7.5],
    [OutputUnit.GAME_DAYS, 8.5, 1, 255.88],
    [OutputUnit.MINUTES, 8.5, 1, 35.29],
    [OutputUnit.SECONDS, 8.5, 1, 0.59],
])(
    "returns the expected output for an item in %s given item create time of: %s and amount created: %s with 5 workers (no tools)",
    async (
        unit: OutputUnit,
        createTime: number,
        amount: number,
        expected: number
    ) => {
        const details = createItemOutputDetails(createTime, amount);
        mockQueryOutputDetails.mockResolvedValue([details]);

        const actual = await calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit,
        });

        expect(actual).toBeCloseTo(expected);
    }
);

describe("handles tool modifiers", () => {
    test.each([
        ["stone min, none provided", DefaultToolset.stone, DefaultToolset.none],
        [
            "copper min, stone provided",
            DefaultToolset.copper,
            DefaultToolset.stone,
        ],
        [
            "iron min, copper provided",
            DefaultToolset.iron,
            DefaultToolset.copper,
        ],
        [
            "bronze min, iron provided",
            DefaultToolset.bronze,
            DefaultToolset.iron,
        ],
        [
            "steel min, bronze provided",
            DefaultToolset.steel,
            DefaultToolset.bronze,
        ],
    ])(
        "throws an error if the provided tool is less than minimum required tool of item (%s)",
        async (
            _: string,
            minimum: DefaultToolset,
            provided: DefaultToolset
        ) => {
            const details = createItemOutputDetails(2, 3, {
                type: "default",
                minimumTool: minimum,
                maximumTool: DefaultToolset.steel,
            });
            mockQueryOutputDetails.mockResolvedValue([details]);
            const expectedError = new Error(
                `Unable to create item with available tools, minimum tool is: ${minimum.toLowerCase()}`
            );

            expect.assertions(1);
            await expect(
                calculateOutput({
                    name: validItemName,
                    workers: validWorkers,
                    unit: OutputUnit.MINUTES,
                    maxAvailableTool: provided,
                })
            ).rejects.toThrow(expectedError);
        }
    );

    test.each([
        [DefaultToolset.none, 450],
        [DefaultToolset.stone, 900],
        [DefaultToolset.copper, 1800],
        [DefaultToolset.iron, 2385],
        [DefaultToolset.bronze, 2767.5],
        [DefaultToolset.steel, 3600],
    ])(
        "returns the expected output for item given applicable tool: %s",
        async (provided: DefaultToolset, expected: number) => {
            const details = createItemOutputDetails(2, 3, {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            });
            mockQueryOutputDetails.mockResolvedValue([details]);

            const actual = await calculateOutput({
                name: validItemName,
                workers: validWorkers,
                unit: OutputUnit.MINUTES,
                maxAvailableTool: provided,
            });

            expect(actual).toBeCloseTo(expected);
        }
    );

    test("returns output for max applicable tool for item if provided tool is better than max", async () => {
        const expected = 1800;
        const details = createItemOutputDetails(2, 3, {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.copper,
        });
        mockQueryOutputDetails.mockResolvedValue([details]);

        const actual = await calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
            maxAvailableTool: DefaultToolset.steel,
        });

        expect(actual).toBeCloseTo(expected);
    });
});

describe("handles machine tool recipes", () => {
    const machineToolDetails = createItemOutputDetails(5, 10, {
        type: "machine",
        minimumTool: MachineToolset.machine,
        maximumTool: MachineToolset.machine,
    });
    const expectedRequiredToolsError = new Error(
        "Unable to create item with available tools, requires machine tools"
    );

    beforeEach(() => {
        mockQueryOutputDetails.mockResolvedValue([machineToolDetails]);
    });

    test.each([
        ["default", undefined],
        ["specified", false],
    ])(
        "throws an error if the item can only be produced by machine tools are not available (%s)",
        async (_: string, hasMachineTools: boolean | undefined) => {
            expect.assertions(1);
            await expect(
                calculateOutput({
                    name: validItemName,
                    workers: validWorkers,
                    unit: OutputUnit.MINUTES,
                    ...(hasMachineTools !== undefined
                        ? { hasMachineTools }
                        : {}),
                })
            ).rejects.toThrow(expectedRequiredToolsError);
        }
    );

    test("returns expected output if machine tools are required and available", async () => {
        const expected = 600;

        const actual = await calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
            hasMachineTools: true,
        });

        expect(actual).toBeCloseTo(expected);
    });

    test("ignores recipe with machine tool requirement if another available tool can be used", async () => {
        const expected = 75;
        const otherDetails = createItemOutputDetails(20, 5);
        mockQueryOutputDetails.mockResolvedValue([
            machineToolDetails,
            otherDetails,
        ]);

        const actual = await calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
            hasMachineTools: false,
        });

        expect(actual).toBeCloseTo(expected);
    });

    test("returns optimal recipe even if one recipe uses machine tools", async () => {
        const expected = 1200;
        const otherDetails = createItemOutputDetails(10, 5, {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.steel,
        });
        mockQueryOutputDetails.mockResolvedValue([
            machineToolDetails,
            otherDetails,
        ]);

        const actual = await calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
            hasMachineTools: true,
            maxAvailableTool: DefaultToolset.steel,
        });

        expect(actual).toBeCloseTo(expected);
    });
});

describe("multiple recipe handling", () => {
    test("returns maximum output when an item has more than one recipe", async () => {
        const expected = 3600;
        const recipes = [
            createItemOutputDetails(2, 3, {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.copper,
            }),
            createItemOutputDetails(1, 3, {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.copper,
            }),
        ];
        mockQueryOutputDetails.mockResolvedValue(recipes);

        const actual = await calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
            maxAvailableTool: DefaultToolset.steel,
        });

        expect(actual).toBeCloseTo(expected);
    });

    test("factors max available tool into max output calculation given recipe w/ lower base output but higher modified", async () => {
        const expected = 1800;
        const recipes = [
            createItemOutputDetails(2, 3, {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.copper,
            }),
            createItemOutputDetails(1, 3, {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.stone,
            }),
        ];
        mockQueryOutputDetails.mockResolvedValue(recipes);

        const actual = await calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
            maxAvailableTool: DefaultToolset.steel,
        });

        expect(actual).toBeCloseTo(expected);
    });

    test("ignores more optimal recipes if cannot be created by provided max tool", async () => {
        const expected = 450;
        const recipes = [
            createItemOutputDetails(2, 3, {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.copper,
            }),
            createItemOutputDetails(1, 3, {
                type: "default",
                minimumTool: DefaultToolset.stone,
                maximumTool: DefaultToolset.stone,
            }),
        ];
        mockQueryOutputDetails.mockResolvedValue(recipes);

        const actual = await calculateOutput({
            name: validItemName,
            workers: validWorkers,
            unit: OutputUnit.MINUTES,
            maxAvailableTool: DefaultToolset.none,
        });

        expect(actual).toBeCloseTo(expected);
    });

    test("throws an error if an item cannot be created by any recipe w/ provided tools", async () => {
        const recipes = [
            createItemOutputDetails(2, 3, {
                type: "default",
                minimumTool: DefaultToolset.copper,
                maximumTool: DefaultToolset.copper,
            }),
            createItemOutputDetails(1, 3, {
                type: "default",
                minimumTool: DefaultToolset.stone,
                maximumTool: DefaultToolset.stone,
            }),
        ];
        mockQueryOutputDetails.mockResolvedValue(recipes);
        const expectedError = `Unable to create item with available tools, minimum tool is: ${DefaultToolset.stone}`;

        expect.assertions(1);
        await expect(
            calculateOutput({
                name: validItemName,
                workers: validWorkers,
                unit: OutputUnit.MINUTES,
                maxAvailableTool: DefaultToolset.none,
            })
        ).rejects.toThrow(expectedError);
    });
});
