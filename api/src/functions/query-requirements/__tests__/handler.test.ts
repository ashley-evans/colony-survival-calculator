import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import type {
    CreatorOverride,
    QueryRequirementArgs,
    Requirement as GraphQLRequirement,
    Tools,
    OutputUnit as GraphQLOutputUnit,
} from "../../../graphql/schema";
import type { Requirement } from "../interfaces/query-requirements-primary-port";
import { queryRequirements } from "../domain/query-requirements";
import { handler } from "../handler";
import { Tools as SchemaTools } from "../../../types";
import { OutputUnit } from "../../../common/output";

jest.mock("../domain/query-requirements", () => ({
    queryRequirements: jest.fn(),
}));

const mockQueryRequirements = queryRequirements as jest.Mock;

const expectedItemName = "test name";
const expectedAmount = 4;

function createMockEvent({
    name,
    workers,
    maxAvailableTool,
    creatorOverrides,
    unit,
    selectionSetList = ["name"],
}: {
    name: string;
    workers: number;
    maxAvailableTool?: Tools;
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
        unit: unit ?? null,
    };

    return mockEvent;
}

beforeEach(() => {
    mockQueryRequirements.mockReset();
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

test.each<[Tools, SchemaTools]>([
    ["NONE", SchemaTools.none],
    ["STONE", SchemaTools.stone],
    ["COPPER", SchemaTools.copper],
    ["IRON", SchemaTools.iron],
    ["BRONZE", SchemaTools.bronze],
    ["STEEL", SchemaTools.steel],
])(
    "calls the domain to fetch requirements for provided event w/ %s tool modifier",
    async (provided: Tools, expectedTool: SchemaTools) => {
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

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    }
);

test("throws the exception if an exception occurs while fetching item requirements", async () => {
    const expectedError = new Error("expected error");
    mockQueryRequirements.mockRejectedValue(expectedError);
    const event = createMockEvent({ name: "test", workers: 1 });

    expect.assertions(1);
    await expect(handler(event)).rejects.toThrow(expectedError);
});
