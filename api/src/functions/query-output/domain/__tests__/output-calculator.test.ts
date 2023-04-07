import { calculateOutput } from "../output-calculator";
import { queryOutputDetails } from "../../adapters/mongodb-output-adapter";
import type { ItemOutputDetails } from "../../interfaces/output-database-port";
import { OutputUnit } from "../../interfaces/query-output-primary-port";

jest.mock("../../adapters/mongodb-output-adapter", () => ({
    queryOutputDetails: jest.fn(),
}));

const mockQueryOutputDetails = queryOutputDetails as jest.Mock;

function createItemOutputDetails(
    createTime: number,
    output: number
): ItemOutputDetails {
    return {
        createTime,
        output,
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

test("throws an error if more than one details are returned from database", async () => {
    mockQueryOutputDetails.mockResolvedValue([
        createItemOutputDetails(1, 2),
        createItemOutputDetails(2, 3),
    ]);
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
    "returns the expected output for an item in %s given item create time of: %s and amount created: %s with 5 workers",
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