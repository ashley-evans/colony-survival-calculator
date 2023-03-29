import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import { handler } from "../handler";
import { calculateOutput } from "../domain/output-calculator";
import type { OutputUnit, QueryOutputArgs } from "../../../graphql/schema";

jest.mock("../domain/output-calculator", () => ({
    calculateOutput: jest.fn(),
}));

const mockCalculateOutput = calculateOutput as jest.Mock;

function createMockEvent(
    name: string,
    workers: number,
    unit: OutputUnit
): AppSyncResolverEvent<QueryOutputArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryOutputArgs>>();
    mockEvent.arguments = {
        name,
        workers,
        unit,
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

test("calls the domain to calculate output given a valid event", async () => {
    await handler(validEvent);

    expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
    expect(mockCalculateOutput).toHaveBeenCalledWith(
        expectedItemName,
        expectedWorkers,
        expectedUnit
    );
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
