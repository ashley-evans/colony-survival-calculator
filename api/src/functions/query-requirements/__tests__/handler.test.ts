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
import type { RequirementResult as DomainResult } from "../interfaces/query-requirements-primary-port";
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
const expectedAmount = 4;

function createMockEvent({
    name,
    workers,
    maxAvailableTool,
    hasMachineTools,
    creatorOverrides,
    unit,
    selectionSetList = ["name"],
}: {
    name: string;
    workers: number;
    maxAvailableTool?: AvailableTools;
    hasMachineTools?: boolean;
    creatorOverrides?: CreatorOverride[];
    unit?: GraphQLOutputUnit;
    selectionSetList?: string[];
}): AppSyncResolverEvent<QueryRequirementArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryRequirementArgs>>();
    mockEvent.info.selectionSetList = selectionSetList;
    mockEvent.arguments = {
        name,
        workers,
        maxAvailableTool: maxAvailableTool ?? null,
        creatorOverrides: creatorOverrides ?? null,
        hasMachineTools: hasMachineTools ?? null,
        unit: unit ?? null,
    };

    return mockEvent;
}

const expectedEmptyResult: DomainResult = { requirements: [], totalWorkers: 0 };

beforeEach(() => {
    mockQueryRequirements.mockReset();
    mockQueryRequirements.mockResolvedValue(expectedEmptyResult);
});

test("calls the domain to fetch requirements for provided event w/o tool modifier", async () => {
    const event = createMockEvent({
        name: expectedItemName,
        workers: expectedAmount,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        name: expectedItemName,
        workers: expectedAmount,
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
            workers: expectedAmount,
            maxAvailableTool: provided,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            name: expectedItemName,
            workers: expectedAmount,
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
            workers: expectedAmount,
            hasMachineTools,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            name: expectedItemName,
            workers: expectedAmount,
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
        workers: expectedAmount,
        creatorOverrides: overrides,
    });

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith({
        name: expectedItemName,
        workers: expectedAmount,
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
            workers: expectedAmount,
            unit: provided,
        });

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith({
            name: expectedItemName,
            workers: expectedAmount,
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
            workers: expectedAmount,
            selectionSetList,
        });

        expect.assertions(1);
        await expect(handler(event)).rejects.toThrow(expectedError);
    }
);

test.each([
    ["no requirements received", expectedEmptyResult, [], 0],
    [
        "multiple requirements received",
        {
            requirements: [
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
            totalWorkers: 65,
        },
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
        65,
    ],
])(
    "returns all items received from domain given %s",
    async (
        _: string,
        returned: DomainResult,
        expectedRequirements: GraphQLRequirement[],
        expectedWorkers: number
    ) => {
        mockQueryRequirements.mockResolvedValue(returned);
        const event = createMockEvent({ name: "test", workers: 1 });

        const actual = await handler(event);
        if (isUserError(actual)) {
            fail();
        }

        expect(actual.__typename).toEqual("Requirements");
        expect(actual.requirements).toHaveLength(expectedRequirements.length);
        expect(actual.requirements).toEqual(
            expect.arrayContaining(expectedRequirements)
        );
        expect(actual.totalWorkers).toEqual(expectedWorkers);
    }
);

test.each([
    ["Invalid item", "Invalid item name provided, must be a non-empty string"],
    [
        "Invalid workers",
        "Invalid number of workers provided, must be a positive number",
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
