import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import { handler } from "../handler";
import { calculateOutput } from "../domain/output-calculator";
import type {
    OutputUnit,
    QueryOutputArgs,
    Tools,
} from "../../../graphql/schema";
import { Tools as SchemaTools } from "../../../types";

jest.mock("../domain/output-calculator", () => ({
    calculateOutput: jest.fn(),
}));

const mockCalculateOutput = calculateOutput as jest.Mock;

function createMockEvent(
    name: string,
    workers: number,
    unit: OutputUnit,
    maxAvailableTool?: Tools,
    creator?: string
): AppSyncResolverEvent<QueryOutputArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryOutputArgs>>();
    mockEvent.arguments = {
        name,
        workers,
        unit,
        maxAvailableTool: maxAvailableTool ?? null,
        creator: creator ?? null,
    };

    return mockEvent;
}

const expectedItemName = "test item name";
const expectedWorkers = 5;
const expectedUnit = "GAME_DAYS";

const validEvent = createMockEvent(
    expectedItemName,
    expectedWorkers,
    expectedUnit
);

beforeEach(() => {
    mockCalculateOutput.mockReset();
});

test("calls the domain to calculate output given a valid event w/o tool", async () => {
    await handler(validEvent);

    expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
    expect(mockCalculateOutput).toHaveBeenCalledWith({
        name: expectedItemName,
        workers: expectedWorkers,
        unit: expectedUnit,
    });
});

test.each<[Tools, SchemaTools]>([
    ["NONE", SchemaTools.none],
    ["STONE", SchemaTools.stone],
    ["COPPER", SchemaTools.copper],
    ["IRON", SchemaTools.iron],
    ["BRONZE", SchemaTools.bronze],
    ["STEEL", SchemaTools.steel],
])(
    "calls the domain to calculate output given a valid event w/ %s tool",
    async (provided: Tools, expectedTool: SchemaTools) => {
        const expectedItemName = "another test item";
        const expectedWorkers = 2;
        const expectedUnit = "MINUTES";
        const event = createMockEvent(
            expectedItemName,
            expectedWorkers,
            expectedUnit,
            provided
        );

        await handler(event);

        expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
        expect(mockCalculateOutput).toHaveBeenCalledWith({
            name: expectedItemName,
            workers: expectedWorkers,
            unit: expectedUnit,
            maxAvailableTool: expectedTool,
        });
    }
);

test("calls the domain to calculate output given a valid event w/ specific creator specified", async () => {
    const expectedCreator = "test item creator";
    const event = createMockEvent(
        expectedItemName,
        expectedWorkers,
        expectedUnit,
        undefined,
        expectedCreator
    );

    await handler(event);

    expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
    expect(mockCalculateOutput).toHaveBeenCalledWith({
        name: expectedItemName,
        workers: expectedWorkers,
        unit: expectedUnit,
        creator: expectedCreator,
    });
});

test("returns the calculated output", async () => {
    const expected = 5;
    mockCalculateOutput.mockResolvedValue(expected);

    const actual = await handler(validEvent);

    expect(actual).toEqual(expected);
});

test("throws an error if any unhandled exceptions occur while calculating output", async () => {
    const expectedError = new Error("test error");
    mockCalculateOutput.mockRejectedValue(expectedError);

    expect.assertions(1);
    await expect(handler(validEvent)).rejects.toThrowError(expectedError);
});
