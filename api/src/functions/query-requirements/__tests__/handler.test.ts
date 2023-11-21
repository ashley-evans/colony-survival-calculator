import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

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
import { DefaultToolset as SchemaTools } from "../../../types";
import { OutputUnit } from "../../../common";

jest.mock("../domain/query-requirements", () => ({
    queryRequirements: jest.fn(),
}));

const mockQueryRequirements = queryRequirements as jest.Mock;

const isUserError = (
    requirementResult: RequirementResult
): requirementResult is UserError => {
    return "message" in requirementResult;
};

const expectedItemName = "test name";
const expectedWorkers = 10;

type GraphQLEventInput = {
    name: string;
    maxAvailableTool?: AvailableTools;
    hasMachineTools?: boolean;
    creatorOverrides?: CreatorOverride[];
    unit?: GraphQLOutputUnit;
    selectionSetList?: string[];
    workers?: number;
    amount?: number;
};

function createMockEvent(
    input: GraphQLEventInput
): AppSyncResolverEvent<QueryRequirementArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryRequirementArgs>>();
    mockEvent.info.selectionSetList = input.selectionSetList ?? ["name"];
    mockEvent.arguments = {
        name: input.name,
        workers: input.workers ?? null,
        amount: input.amount ?? null,
        maxAvailableTool: input.maxAvailableTool ?? null,
        creatorOverrides: input.creatorOverrides ?? null,
        hasMachineTools: input.hasMachineTools ?? null,
        unit: input.unit ?? null,
    };

    return mockEvent;
}

beforeEach(() => {
    mockQueryRequirements.mockReset();
});

test("calls the domain to fetch requirements for provided event w/o tool modifier", async () => {
    const event = createMockEvent({
        name: expectedItemName,
        workers: expectedWorkers,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        name: expectedItemName,
        workers: expectedWorkers,
    });
});

test("calls the domain to fetch requirements to satisfy target output given event with target amount", async () => {
    const expectedAmount = 5;
    const event = createMockEvent({
        name: expectedItemName,
        amount: expectedAmount,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        name: expectedItemName,
        amount: expectedAmount,
    });
});

test.each<[AvailableTools, SchemaTools]>([
    ["NONE", SchemaTools.none],
    ["STONE", SchemaTools.stone],
    ["COPPER", SchemaTools.copper],
    ["IRON", SchemaTools.iron],
    ["BRONZE", SchemaTools.bronze],
    ["STEEL", SchemaTools.steel],
])(
    "calls the domain to fetch requirements for provided event w/ %s tool modifier",
    async (provided: AvailableTools, expectedTool: SchemaTools) => {
        const event = createMockEvent({
            name: expectedItemName,
            workers: expectedWorkers,
            maxAvailableTool: provided,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            name: expectedItemName,
            workers: expectedWorkers,
            maxAvailableTool: expectedTool,
        });
    }
);

test.each([
    ["available", true],
    ["unavailable", false],
])(
    "calls the domain to fetch requirements given machine tool %s",
    async (_: string, hasMachineTools: boolean) => {
        const event = createMockEvent({
            name: expectedItemName,
            workers: expectedWorkers,
            hasMachineTools,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            name: expectedItemName,
            workers: expectedWorkers,
            hasMachineTools,
        });
    }
);

test("provides specified creator overrides to domain if provided", async () => {
    const overrides: CreatorOverride[] = [
        {
            itemName: "test name",
            creator: "first creator",
        },
        {
            itemName: "second item",
            creator: "another creator",
        },
    ];
    const event = createMockEvent({
        name: expectedItemName,
        workers: expectedWorkers,
        creatorOverrides: overrides,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        name: expectedItemName,
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
            name: expectedItemName,
            workers: expectedWorkers,
            unit: provided,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            name: expectedItemName,
            workers: expectedWorkers,
            unit: expected,
        });
    }
);

test.each([
    ["overall output amount", ["amount"]],
    ["requirement creator output amount", ["creators/amount"]],
    ["requirement creator output amount", ["creators/demands/amount"]],
])(
    "throws invalid arguments exception if %s is queried without providing output unit",
    async (_: string, selectionSetList: string[]) => {
        const expectedError = new Error(
            "Invalid arguments: Must provide output unit when querying amounts"
        );
        const event = createMockEvent({
            name: expectedItemName,
            workers: expectedWorkers,
            selectionSetList,
        });

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrow(expectedError);
    }
);

test.each([
    ["neither amount or workers parameters are provided", undefined, undefined],
    ["both amount and workers parameters are provided", 1, 1],
])(
    "throws an invalid argument exception if %s",
    async (_: string, amount?: number, workers?: number) => {
        const expectedError = new Error(
            "Invalid arguments: Must provide either amount or workers when querying requirements (not both)"
        );
        const event = createMockEvent({
            name: expectedItemName,
            ...(amount ? { amount } : {}),
            ...(workers ? { workers } : {}),
        });

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrow(expectedError);
    }
);

test.each([
    ["no requirements received", [], []],
    [
        "multiple requirements received",
        [
            {
                name: "test item 1",
                amount: 60,
                creators: [
                    {
                        name: "test item 1",
                        creator: "test item 1 creator",
                        amount: 60,
                        workers: 5,
                        demands: [{ name: "required item 1", amount: 80 }],
                    },
                ],
            },
            {
                name: "required item 1",
                amount: 80,
                creators: [
                    {
                        name: "required item 1",
                        creator: "required item 1 creator",
                        amount: 80,
                        workers: 60,
                        demands: [],
                    },
                ],
            },
        ],
        [
            {
                name: "test item 1",
                amount: 60,
                creators: [
                    {
                        name: "test item 1",
                        creator: "test item 1 creator",
                        amount: 60,
                        workers: 5,
                        demands: [{ name: "required item 1", amount: 80 }],
                    },
                ],
            },
            {
                name: "required item 1",
                amount: 80,
                creators: [
                    {
                        name: "required item 1",
                        creator: "required item 1 creator",
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
        expected: GraphQLRequirement[]
    ) => {
        mockQueryRequirements.mockResolvedValue(returned);
        const event = createMockEvent({ name: "test", workers: 1 });

        const actual = await handler(event);
        if (isUserError(actual)) {
            fail();
        }

        expect(actual.__typename).toEqual("Requirements");
        expect(actual.requirements).toHaveLength(expected.length);
        expect(actual.requirements).toEqual(expect.arrayContaining(expected));
    }
);

test.each([
    ["Invalid item", "Invalid item name provided, must be a non-empty string"],
    [
        "Invalid workers",
        "Invalid number of workers provided, must be a positive number",
    ],
    [
        "Invalid target amount",
        "Invalid target output provided, must be a positive number",
    ],
    ["Unknown item", "Unknown item provided"],
    [
        "Minimum tool",
        "Unable to create item with available tools, minimum tool is: Steel",
    ],
    [
        "Duplicate override",
        "Invalid input: More than one creator override provided for: test",
    ],
    [
        "Not craft-able due to override",
        "Invalid input, item is not creatable with current overrides",
    ],
])(
    "returns a user if known error: %s occurs while fetching item requirements",
    async (_: string, error: string) => {
        mockQueryRequirements.mockRejectedValue(new Error(error));
        const event = createMockEvent({ name: "test", workers: 1 });

        const actual = await handler(event);
        if (!isUserError(actual)) {
            fail();
        }

        expect(actual).toEqual({ __typename: "UserError", message: error });
    }
);

test("throws the exception if an unknown exception occurs while fetching item requirements", async () => {
    const expectedError = new Error("expected error");
    mockQueryRequirements.mockRejectedValue(expectedError);
    const event = createMockEvent({ name: "test", workers: 1 });

    expect.assertions(1);
    await expect(handler(event)).rejects.toThrow(expectedError);
});
