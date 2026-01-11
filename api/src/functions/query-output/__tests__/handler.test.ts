import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "vitest-mock-extended";
import { vi, Mock } from "vitest";

import { handler } from "../handler";
import { calculateOutput } from "../domain/output-calculator";
import type {
    OutputUnit,
    QueryOutputArgs,
    AvailableTools,
} from "../../../graphql/schema";
import { DefaultToolset as SchemaTools } from "../../../types";

vi.mock("../domain/output-calculator", () => ({
    calculateOutput: vi.fn(),
}));

const mockCalculateOutput = calculateOutput as Mock;

function createMockEvent(
    id: string,
    workers: number,
    unit: OutputUnit,
    maxAvailableTool?: AvailableTools,
    hasMachineTools?: boolean,
    creatorID?: string,
): AppSyncResolverEvent<QueryOutputArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryOutputArgs>>();
    mockEvent.arguments = {
        id,
        workers,
        unit,
        maxAvailableTool: maxAvailableTool ?? null,
        hasMachineTools: hasMachineTools ?? null,
        creatorID: creatorID ?? null,
    };

    return mockEvent;
}

const expectedItemID = "testitem";
const expectedCreatorID = "testitemcreator";
const expectedWorkers = 5;
const expectedUnit = "GAME_DAYS";

const validEvent = createMockEvent(
    expectedItemID,
    expectedWorkers,
    expectedUnit,
);

beforeEach(() => {
    mockCalculateOutput.mockReset();
});

test("calls the domain to calculate output given a valid event w/o tool", async () => {
    await handler(validEvent);

    expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
    expect(mockCalculateOutput).toHaveBeenCalledWith({
        id: expectedItemID,
        workers: expectedWorkers,
        unit: expectedUnit,
    });
});

test.each<[AvailableTools, SchemaTools]>([
    ["NONE", "none" as SchemaTools],
    ["STONE", "stone" as SchemaTools],
    ["COPPER", "copper" as SchemaTools],
    ["IRON", "iron" as SchemaTools],
    ["BRONZE", "bronze" as SchemaTools],
    ["STEEL", "steel" as SchemaTools],
])(
    "calls the domain to calculate output given a valid event w/ %s tool",
    async (provided: AvailableTools, expectedTool: SchemaTools) => {
        const expectedItemID = "anothertestitem";
        const expectedWorkers = 2;
        const expectedUnit = "MINUTES";
        const event = createMockEvent(
            expectedItemID,
            expectedWorkers,
            expectedUnit,
            provided,
        );

        await handler(event);

        expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
        expect(mockCalculateOutput).toHaveBeenCalledWith({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expectedUnit,
            maxAvailableTool: expectedTool,
        });
    },
);

test("calls the domain to calculate output given a valid event w/ specific creator specified", async () => {
    const event = createMockEvent(
        expectedItemID,
        expectedWorkers,
        expectedUnit,
        undefined,
        undefined,
        expectedCreatorID,
    );

    await handler(event);

    expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
    expect(mockCalculateOutput).toHaveBeenCalledWith({
        id: expectedItemID,
        workers: expectedWorkers,
        unit: expectedUnit,
        creatorID: expectedCreatorID,
    });
});

test.each([
    ["available", true],
    ["unavailable", false],
])(
    "calls the domain to calculate output given machine tool %s",
    async (_: string, hasMachineTools: boolean) => {
        const event = createMockEvent(
            expectedItemID,
            expectedWorkers,
            expectedUnit,
            undefined,
            hasMachineTools,
            expectedCreatorID,
        );

        await handler(event);

        expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
        expect(mockCalculateOutput).toHaveBeenCalledWith({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expectedUnit,
            creatorID: expectedCreatorID,
            hasMachineTools,
        });
    },
);

test("returns the calculated output", async () => {
    const expected = 5;
    mockCalculateOutput.mockResolvedValue(expected);

    const actual = await handler(validEvent);

    expect(actual).toEqual({ __typename: "OptimalOutput", amount: expected });
});

test.each([
    ["Invalid item", "Invalid item ID provided, must be a non-empty string"],
    [
        "Invalid workers",
        "Invalid number of workers provided, must be a positive number",
    ],
    ["Unknown item", "Unknown item provided"],
    [
        "Minimum tool",
        "Unable to create item with available tools, minimum tool is: Steel",
    ],
])(
    "returns a user if known error: %s occurs while fetching item requirements",
    async (_: string, error: string) => {
        mockCalculateOutput.mockRejectedValue(new Error(error));

        const actual = await handler(validEvent);

        expect(actual).toEqual({ __typename: "UserError", message: error });
    },
);

test("throws an error if any unhandled exceptions occur while calculating output", async () => {
    const expectedError = new Error("test error");
    mockCalculateOutput.mockRejectedValue(expectedError);

    expect.assertions(1);
    await expect(handler(validEvent)).rejects.toThrowError(expectedError);
});
