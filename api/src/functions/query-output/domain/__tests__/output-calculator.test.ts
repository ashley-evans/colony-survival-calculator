import { calculateOutput } from "../output-calculator";
import { queryOutputDetails } from "../../adapters/mongodb-output-adapter";
import type { ItemOutputDetails } from "../../interfaces/output-database-port";
import { OutputUnit } from "../../interfaces/query-output-primary-port";
import { Tools } from "../../../../types";

jest.mock("../../adapters/mongodb-output-adapter", () => ({
    queryOutputDetails: jest.fn(),
}));

const mockQueryOutputDetails = queryOutputDetails as jest.Mock;

function createItemOutputDetails(
    createTime: number,
    output: number,
    minimumTool: Tools = Tools.none,
    maximumTool: Tools = Tools.none
): ItemOutputDetails {
    return {
        createTime,
        output,
        minimumTool,
        maximumTool,
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
        calculateOutput("", validWorkers, OutputUnit.MINUTES)
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
            calculateOutput(validItemName, amount, OutputUnit.MINUTES)
        ).rejects.toThrow(expectedError);
    }
);

test("calls the database adapter to get the output details for the provided item", async () => {
    const details = createItemOutputDetails(2, 3);
    mockQueryOutputDetails.mockResolvedValue([details]);

    await calculateOutput(validItemName, validWorkers, OutputUnit.MINUTES);

    expect(mockQueryOutputDetails).toHaveBeenCalledTimes(1);
    expect(mockQueryOutputDetails).toHaveBeenCalledWith(validItemName);
});

test("throws an error if no item output details are returned from DB", async () => {
    mockQueryOutputDetails.mockResolvedValue([]);
    const expectedError = new Error("Unknown item provided");

    expect.assertions(1);
    await expect(
        calculateOutput(validItemName, validWorkers, OutputUnit.MINUTES)
    ).rejects.toThrow(expectedError);
});

test("throws an error if an unhandled exception occurs while fetching item requirements", async () => {
    mockQueryOutputDetails.mockRejectedValue(new Error("unhandled"));
    const expectedError = new Error("Internal server error");

    expect.assertions(1);
    await expect(
        calculateOutput(validItemName, validWorkers, OutputUnit.MINUTES)
    ).rejects.toThrow(expectedError);
});

test.each([
    [OutputUnit.GAME_DAYS, 2, 3, 3262.5],
    [OutputUnit.MINUTES, 2, 3, 450],
    [OutputUnit.GAME_DAYS, 8.5, 1, 255.88],
    [OutputUnit.MINUTES, 8.5, 1, 35.29],
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

        const actual = await calculateOutput(validItemName, validWorkers, unit);

        expect(actual).toBeCloseTo(expected);
    }
);

describe("handles tool modifiers", () => {
    test.each([
        ["stone min, none provided", Tools.stone, Tools.none],
        ["copper min, stone provided", Tools.copper, Tools.stone],
        ["iron min, copper provided", Tools.iron, Tools.copper],
        ["bronze min, iron provided", Tools.bronze, Tools.iron],
        ["steel min, bronze provided", Tools.steel, Tools.bronze],
    ])(
        "throws an error if the provided tool is less than minimum required tool of item (%s)",
        async (_: string, minimum: Tools, provided: Tools) => {
            const details = createItemOutputDetails(2, 3, minimum, Tools.steel);
            mockQueryOutputDetails.mockResolvedValue([details]);
            const expectedError = new Error(
                `Unable to create item with available tools, minimum tool is: ${minimum.toLowerCase()}`
            );

            expect.assertions(1);
            await expect(
                calculateOutput(
                    validItemName,
                    validWorkers,
                    OutputUnit.MINUTES,
                    provided
                )
            ).rejects.toThrow(expectedError);
        }
    );

    test.each([
        [Tools.none, 450],
        [Tools.stone, 900],
        [Tools.copper, 1800],
        [Tools.iron, 2385],
        [Tools.bronze, 2767.5],
        [Tools.steel, 3600],
    ])(
        "returns the expected output for item given applicable tool: %s",
        async (provided: Tools, expected: number) => {
            const details = createItemOutputDetails(
                2,
                3,
                Tools.none,
                Tools.steel
            );
            mockQueryOutputDetails.mockResolvedValue([details]);

            const actual = await calculateOutput(
                validItemName,
                validWorkers,
                OutputUnit.MINUTES,
                provided
            );

            expect(actual).toBeCloseTo(expected);
        }
    );

    test("returns output for max applicable tool for item if provided tool is better than max", async () => {
        const expected = 1800;
        const details = createItemOutputDetails(2, 3, Tools.none, Tools.copper);
        mockQueryOutputDetails.mockResolvedValue([details]);

        const actual = await calculateOutput(
            validItemName,
            validWorkers,
            OutputUnit.MINUTES,
            Tools.steel
        );

        expect(actual).toBeCloseTo(expected);
    });
});

describe("multiple recipe handling", () => {
    test("returns maximum output when an item has more than one recipe", async () => {
        const expected = 3600;
        const recipes = [
            createItemOutputDetails(2, 3, Tools.none, Tools.copper),
            createItemOutputDetails(1, 3, Tools.none, Tools.copper),
        ];
        mockQueryOutputDetails.mockResolvedValue(recipes);

        const actual = await calculateOutput(
            validItemName,
            validWorkers,
            OutputUnit.MINUTES,
            Tools.steel
        );

        expect(actual).toBeCloseTo(expected);
    });

    test("factors max available tool into max output calculation given recipe w/ lower base output but higher modified", async () => {
        const expected = 1800;
        const recipes = [
            createItemOutputDetails(2, 3, Tools.none, Tools.copper),
            createItemOutputDetails(1, 3, Tools.none, Tools.stone),
        ];
        mockQueryOutputDetails.mockResolvedValue(recipes);

        const actual = await calculateOutput(
            validItemName,
            validWorkers,
            OutputUnit.MINUTES,
            Tools.steel
        );

        expect(actual).toBeCloseTo(expected);
    });

    test("ignores more optimal recipes if cannot be created by provided max tool", async () => {
        const expected = 450;
        const recipes = [
            createItemOutputDetails(2, 3, Tools.none, Tools.copper),
            createItemOutputDetails(1, 3, Tools.stone, Tools.stone),
        ];
        mockQueryOutputDetails.mockResolvedValue(recipes);

        const actual = await calculateOutput(
            validItemName,
            validWorkers,
            OutputUnit.MINUTES,
            Tools.none
        );

        expect(actual).toBeCloseTo(expected);
    });

    test("throws an error if an item cannot be created by any recipe w/ provided tools", async () => {
        const recipes = [
            createItemOutputDetails(2, 3, Tools.copper, Tools.copper),
            createItemOutputDetails(1, 3, Tools.stone, Tools.stone),
        ];
        mockQueryOutputDetails.mockResolvedValue(recipes);
        const expectedError = `Unable to create item with available tools, minimum tool is: ${Tools.stone}`;

        expect.assertions(1);
        await expect(
            calculateOutput(
                validItemName,
                validWorkers,
                OutputUnit.MINUTES,
                Tools.none
            )
        ).rejects.toThrow(expectedError);
    });
});
