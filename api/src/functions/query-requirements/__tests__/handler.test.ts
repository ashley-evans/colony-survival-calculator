import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import type {
    QueryRequirementArgs,
    Requirement as GraphQLRequirement,
    Tools,
} from "../../../graphql/schema";
import type { RequiredWorkers } from "../interfaces/query-requirements-primary-port";
import { queryRequirements } from "../domain/query-requirements";
import { handler } from "../handler";
import { Tools as SchemaTools } from "../../../types";

jest.mock("../domain/query-requirements", () => ({
    queryRequirements: jest.fn(),
}));

const mockQueryRequirements = queryRequirements as jest.Mock;

function createMockEvent(
    name: string,
    workers: number,
    maxAvailableTool?: Tools
): AppSyncResolverEvent<QueryRequirementArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryRequirementArgs>>();
    mockEvent.arguments = {
        name,
        workers,
        maxAvailableTool: maxAvailableTool ?? null,
    };

    return mockEvent;
}

beforeEach(() => {
    mockQueryRequirements.mockReset();
});

test("calls the domain to fetch requirements for provided event w/o tool modifier", async () => {
    const expectedItemName = "test name";
    const expectedAmount = 4;
    const event = createMockEvent(expectedItemName, expectedAmount);

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith(
        expectedItemName,
        expectedAmount,
        undefined
    );
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
        const expectedItemName = "test name";
        const expectedAmount = 4;
        const event = createMockEvent(
            expectedItemName,
            expectedAmount,
            provided
        );

        await handler(event);

        expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
        expect(mockQueryRequirements).toHaveBeenCalledWith(
            expectedItemName,
            expectedAmount,
            expectedTool
        );
    }
);

test.each([
    ["no requirements received", [], []],
    [
        "multiple requirements received",
        [
            { name: "test", workers: 2 },
            { name: "test 2", workers: 5 },
        ],
        [
            { name: "test", workers: 2 },
            { name: "test 2", workers: 5 },
        ],
    ],
])(
    "returns all items received from domain given %s",
    async (
        _: string,
        returned: RequiredWorkers[],
        expected: GraphQLRequirement[]
    ) => {
        mockQueryRequirements.mockResolvedValue(returned);
        const event = createMockEvent("test", 1);

        const actual = await handler(event);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    }
);

test("throws the exception if an exception occurs while fetching item requirements", async () => {
    const expectedError = new Error("expected error");
    mockQueryRequirements.mockRejectedValue(expectedError);
    const event = createMockEvent("test", 1);

    expect.assertions(1);
    await expect(handler(event)).rejects.toThrow(expectedError);
});
