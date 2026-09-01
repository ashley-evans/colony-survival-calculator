import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "vitest-mock-extended";
import { vi, Mock } from "vitest";

import { handler } from "../handler";
import { calculateOutput } from "../domain/output-calculator";
import type {
    OutputUnit,
    QueryOutputArgs,
    AvailableDefaultTools,
    AvailableTools,
} from "../../../graphql/schema";
import { DefaultToolset as SchemaTools } from "../../../types";
import { ErrorCode, UserError } from "../../../common";

vi.mock("../domain/output-calculator", () => ({
    calculateOutput: vi.fn(),
}));

const mockCalculateOutput = calculateOutput as Mock;

type MockEventInput = {
    id: string;
    workers: number;
    unit: OutputUnit;
    availableTools?: AvailableTools;
    creatorID?: string;
};

function createMockEvent({
    id,
    workers,
    unit,
    availableTools,
    creatorID,
}: MockEventInput): AppSyncResolverEvent<QueryOutputArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryOutputArgs>>();
    mockEvent.arguments = {
        input: {
            id,
            workers,
            unit,
            ...(availableTools ? { availableTools } : {}),
            ...(creatorID ? { creatorID } : {}),
        },
    };

    return mockEvent;
}

const expectedItemID = "testitem";
const expectedCreatorID = "testitemcreator";
const expectedWorkers = 5;
const expectedUnit = "GAME_DAYS";

const validEvent = createMockEvent({
    id: expectedItemID,
    workers: expectedWorkers,
    unit: expectedUnit,
});

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

test.each<[AvailableDefaultTools, SchemaTools]>([
    ["NONE", "none" as SchemaTools],
    ["STONE", "stone" as SchemaTools],
    ["COPPER", "copper" as SchemaTools],
    ["IRON", "iron" as SchemaTools],
    ["BRONZE", "bronze" as SchemaTools],
    ["STEEL", "steel" as SchemaTools],
])(
    "calls the domain to calculate output given a valid event w/ %s tool",
    async (provided: AvailableDefaultTools, expectedTool: SchemaTools) => {
        const expectedItemID = "anothertestitem";
        const expectedWorkers = 2;
        const expectedUnit = "MINUTES";
        const event = createMockEvent({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expectedUnit,
            availableTools: { default: provided },
        });

        await handler(event);

        expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
        expect(mockCalculateOutput).toHaveBeenCalledWith({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expectedUnit,
            availableTools: { default: expectedTool },
        });
    },
);

test("calls the domain to calculate output given a valid event w/ specific creator specified", async () => {
    const event = createMockEvent({
        id: expectedItemID,
        workers: expectedWorkers,
        unit: expectedUnit,
        creatorID: expectedCreatorID,
    });

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
        const event = createMockEvent({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expectedUnit,
            availableTools: { machine: hasMachineTools },
            creatorID: expectedCreatorID,
        });

        await handler(event);

        expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
        expect(mockCalculateOutput).toHaveBeenCalledWith({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expectedUnit,
            creatorID: expectedCreatorID,
            availableTools: { machine: hasMachineTools },
        });
    },
);

test.each([
    ["available", true],
    ["unavailable", false],
])(
    "calls the domain to calculate output given eyeglasses %s",
    async (_: string, hasEyeglasses: boolean) => {
        const event = createMockEvent({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expectedUnit,
            availableTools: { eyeglasses: hasEyeglasses },
            creatorID: expectedCreatorID,
        });

        await handler(event);

        expect(mockCalculateOutput).toHaveBeenCalledTimes(1);
        expect(mockCalculateOutput).toHaveBeenCalledWith({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expectedUnit,
            creatorID: expectedCreatorID,
            availableTools: { eyeglasses: hasEyeglasses },
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
    ["Invalid item", ErrorCode.INVALID_ITEM_ID],
    ["Invalid workers", ErrorCode.INVALID_WORKERS],
    ["Unknown item", ErrorCode.UNKNOWN_ITEM],
    ["Minimum tool", ErrorCode.TOOL_LEVEL, { requiredTool: "steel" }],
])(
    "returns a user error if known error: %s occurs while fetching item requirements",
    async (
        _: string,
        errorCode: ErrorCode,
        details?: Record<string, string>,
    ) => {
        mockCalculateOutput.mockRejectedValue(
            new UserError(errorCode, details),
        );

        const actual = await handler(validEvent);

        expect(actual).toEqual({
            __typename: "UserError",
            code: errorCode,
            details: details !== undefined ? JSON.stringify(details) : null,
        });
    },
);

test("throws an error if any unhandled exceptions occur while calculating output", async () => {
    const expectedError = new Error("test error");
    mockCalculateOutput.mockRejectedValue(expectedError);

    expect.assertions(1);
    await expect(handler(validEvent)).rejects.toThrowError(expectedError);
});
