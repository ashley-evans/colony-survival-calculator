import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import type {
    QueryRequirementArgs,
    Requirement as GraphQLRequirement,
} from "../../../graphql/schema";
import type { RequiredWorkers } from "../interfaces/query-requirements-primary-port";
import { queryRequirements } from "../domain/query-requirements";
import { handler } from "../handler";

jest.mock("../domain/query-requirements", () => ({
    queryRequirements: jest.fn(),
}));

const mockQueryRequirements = queryRequirements as jest.Mock;

function createMockEvent(
    name: string,
    workers: number
): AppSyncResolverEvent<QueryRequirementArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryRequirementArgs>>();
    mockEvent.arguments = {
        name,
        workers,
    };

    return mockEvent;
}

test("calls the domain to fetch requirements for provided item", async () => {
    const expectedItemName = "test name";
    const expectedAmount = 4;
    const event = createMockEvent(expectedItemName, expectedAmount);

    await handler(event);

    expect(mockQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockQueryRequirements).toHaveBeenCalledWith(
        expectedItemName,
        expectedAmount
    );
});

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
