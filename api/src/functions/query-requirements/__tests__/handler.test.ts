import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "vitest-mock-extended";
import { vi, Mock } from "vitest";

import type {
    CreatorOverride,
    QueryRequirementArgs,
    Requirement as GraphQLRequirement,
    OutputUnit as GraphQLOutputUnit,
    RequirementResult,
    UserError,
    AvailableTools,
} from "../../../graphql/schema";
import type { Requirement } from "../interfaces/query-requirements-primary-port";
import { queryRequirements } from "../domain/query-requirements";
import { handler } from "../handler";
import type { DefaultToolset as SchemaTools } from "../../../types";
import {
    UserError as UserErrorClass,
    ErrorCode,
    OutputUnit,
} from "../../../common";

vi.mock("../domain/query-requirements", () => ({
    queryRequirements: vi.fn(),
}));

const mockQueryRequirements = queryRequirements as Mock;

const isUserError = (
    requirementResult: RequirementResult,
): requirementResult is UserError => {
    return "code" in requirementResult;
};

const expectedItemID = "test id";
const expectedWorkers = 10;

type GraphQLEventInput = {
    id: string;
    maxAvailableTool?: AvailableTools;
    hasMachineTools?: boolean;
    creatorOverrides?: CreatorOverride[];
    unit?: GraphQLOutputUnit;
    selectionSetList?: string[];
    workers?: number;
    amount?: number;
    locale?: string;
};

function createMockEvent(
    input: GraphQLEventInput,
): AppSyncResolverEvent<QueryRequirementArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryRequirementArgs>>();
    mockEvent.info.selectionSetList = input.selectionSetList ?? ["name"];
    mockEvent.arguments = {
        id: input.id,
        workers: input.workers ?? null,
        amount: input.amount ?? null,
        maxAvailableTool: input.maxAvailableTool ?? null,
        creatorOverrides: input.creatorOverrides ?? null,
        hasMachineTools: input.hasMachineTools ?? null,
        unit: input.unit ?? null,
        locale: input.locale ?? null,
    };

    return mockEvent;
}

beforeEach(() => {
    mockQueryRequirements.mockReset();
});

test("calls the domain to fetch requirements for provided event w/o tool modifier", async () => {
    const event = createMockEvent({
        id: expectedItemID,
        workers: expectedWorkers,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        id: expectedItemID,
        workers: expectedWorkers,
    });
});

test("calls the domain to fetch requirements to satisfy target output given event with target amount", async () => {
    const expectedAmount = 5;
    const event = createMockEvent({
        id: expectedItemID,
        amount: expectedAmount,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        id: expectedItemID,
        amount: expectedAmount,
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
    "calls the domain to fetch requirements for provided event w/ %s tool modifier",
    async (provided: AvailableTools, expectedTool: SchemaTools) => {
        const event = createMockEvent({
            id: expectedItemID,
            workers: expectedWorkers,
            maxAvailableTool: provided,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            id: expectedItemID,
            workers: expectedWorkers,
            maxAvailableTool: expectedTool,
        });
    },
);

test.each([
    ["available", true],
    ["unavailable", false],
])(
    "calls the domain to fetch requirements given machine tool %s",
    async (_: string, hasMachineTools: boolean) => {
        const event = createMockEvent({
            id: expectedItemID,
            workers: expectedWorkers,
            hasMachineTools,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            id: expectedItemID,
            workers: expectedWorkers,
            hasMachineTools,
        });
    },
);

test("provides specified creator overrides to domain if provided", async () => {
    const overrides: CreatorOverride[] = [
        {
            itemID: "test id",
            creatorID: "first creator",
        },
        {
            itemID: "second item",
            creatorID: "another creator",
        },
    ];
    const event = createMockEvent({
        id: expectedItemID,
        workers: expectedWorkers,
        creatorOverrides: overrides,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        id: expectedItemID,
        workers: expectedWorkers,
        creatorOverrides: overrides,
    });
});

test.each<[GraphQLOutputUnit, OutputUnit]>([
    ["GAME_DAYS", OutputUnit.GAME_DAYS],
    ["MINUTES", OutputUnit.MINUTES],
    ["SECONDS", OutputUnit.SECONDS],
])(
    "provides %s output unit to domain if provided",
    async (provided: GraphQLOutputUnit, expected: OutputUnit) => {
        const event = createMockEvent({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: provided,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            id: expectedItemID,
            workers: expectedWorkers,
            unit: expected,
        });
    },
);

test("provides specified locale to domain if provided", async () => {
    const expectedLocale = "en-US";
    const event = createMockEvent({
        id: expectedItemID,
        workers: expectedWorkers,
        locale: expectedLocale,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        id: expectedItemID,
        workers: expectedWorkers,
        locale: expectedLocale,
    });
});

test("does not pass locale to domain if not provided", async () => {
    const event = createMockEvent({
        id: expectedItemID,
        workers: expectedWorkers,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledWith(
        expect.not.objectContaining({ locale: expect.anything() }),
    );
});

test.each([
    ["overall output amount", ["amount"]],
    ["requirement creator output amount", ["creators/amount"]],
    ["requirement creator output amount", ["creators/demands/amount"]],
])(
    "throws invalid arguments exception if %s is queried without providing output unit",
    async (_: string, selectionSetList: string[]) => {
        const expectedError = new Error(
            "Invalid arguments: Must provide output unit when querying amounts",
        );
        const event = createMockEvent({
            id: expectedItemID,
            workers: expectedWorkers,
            selectionSetList,
        });

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrow(expectedError);
    },
);

test.each([
    ["neither amount or workers parameters are provided", undefined, undefined],
    ["both amount and workers parameters are provided", 1, 1],
])(
    "throws an invalid argument exception if %s",
    async (_: string, amount?: number, workers?: number) => {
        const expectedError = new Error(
            "Invalid arguments: Must provide either amount or workers when querying requirements (not both)",
        );
        const event = createMockEvent({
            id: expectedItemID,
            ...(amount ? { amount } : {}),
            ...(workers ? { workers } : {}),
        });

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrow(expectedError);
    },
);

test.each([
    ["no requirements received", [], []],
    [
        "multiple requirements received",
        [
            {
                id: "test-item-1",
                name: "test item 1",
                amount: 60,
                creators: [
                    {
                        id: "test-item-1-creator-1",
                        name: "test item 1",
                        creator: "test item 1 creator",
                        creatorID: "test-item-1-creator-id-1",
                        amount: 60,
                        workers: 5,
                        demands: [
                            {
                                id: "required-item-1",
                                name: "required item 1",
                                amount: 80,
                            },
                        ],
                    },
                ],
            },
            {
                id: "required-item-1",
                name: "required item 1",
                amount: 80,
                creators: [
                    {
                        id: "required-item-1-creator-1",
                        name: "required item 1",
                        creator: "required item 1 creator",
                        creatorID: "required-item-1-creator-id-1",
                        amount: 80,
                        workers: 60,
                        demands: [],
                    },
                ],
            },
        ],
        [
            {
                id: "test-item-1",
                name: "test item 1",
                amount: 60,
                creators: [
                    {
                        id: "test-item-1-creator-1",
                        name: "test item 1",
                        creator: "test item 1 creator",
                        creatorID: "test-item-1-creator-id-1",
                        amount: 60,
                        workers: 5,
                        demands: [
                            {
                                id: "required-item-1",
                                name: "required item 1",
                                amount: 80,
                            },
                        ],
                    },
                ],
            },
            {
                id: "required-item-1",
                name: "required item 1",
                amount: 80,
                creators: [
                    {
                        id: "required-item-1-creator-1",
                        name: "required item 1",
                        creator: "required item 1 creator",
                        creatorID: "required-item-1-creator-id-1",
                        amount: 80,
                        workers: 60,
                        demands: [],
                    },
                ],
            },
        ],
    ],
])(
    "returns all items received from domain given %s",
    async (
        _: string,
        returned: Requirement[],
        expected: GraphQLRequirement[],
    ) => {
        mockQueryRequirements.mockResolvedValue(returned);
        const event = createMockEvent({ id: "test", workers: 1 });

        const actual = await handler(event);
        if (isUserError(actual)) {
            assert.fail();
        }

        expect(actual.__typename).toEqual("Requirements");
        expect(actual.requirements).toHaveLength(expected.length);
        expect(actual.requirements).toEqual(expect.arrayContaining(expected));
    },
);

test.each([
    ["Invalid item", ErrorCode.INVALID_ITEM_ID],
    ["Invalid workers", ErrorCode.INVALID_WORKERS],
    ["Invalid target amount", ErrorCode.INVALID_TARGET],
    ["Unknown item", ErrorCode.UNKNOWN_ITEM],
    ["Minimum tool", ErrorCode.TOOL_LEVEL_ERROR, { requiredTool: "steel" }],
    [
        "Duplicate override",
        ErrorCode.MULTIPLE_OVERRIDE_ERROR,
        { itemId: "test" },
    ],
    [
        "Not craft-able due to override",
        ErrorCode.INVALID_OVERRIDE_ITEM_NOT_CREATABLE,
    ],
])(
    "returns a user error if known error: %s occurs while fetching item requirements",
    async (
        _: string,
        errorCode: ErrorCode,
        details?: Record<string, string>,
    ) => {
        mockQueryRequirements.mockRejectedValue(
            new UserErrorClass(errorCode, details),
        );
        const event = createMockEvent({ id: "test", workers: 1 });

        const actual = await handler(event);
        if (!isUserError(actual)) {
            assert.fail();
        }

        expect(actual.__typename).toEqual("UserError");
        expect(actual.code).toEqual(errorCode);
        expect(actual.details).toEqual(
            details !== undefined ? JSON.stringify(details) : null,
        );
    },
);

test("throws the exception if an unknown exception occurs while fetching item requirements", async () => {
    const expectedError = new Error("expected error");
    mockQueryRequirements.mockRejectedValue(expectedError);
    const event = createMockEvent({ id: "test", workers: 1 });

    expect.assertions(1);
    await expect(handler(event)).rejects.toThrow(expectedError);
});
