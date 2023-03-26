import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import type {
    QueryRequirementArgs,
    Requirement as GraphQLRequirement,
} from "../../../graphql/schema";
import type { Requirement } from "../../../types";
import { queryRequirements } from "../domain/query-requirements";
import { handler } from "../handler";

jest.mock("../domain/query-requirements", () => ({
    queryRequirements: jest.fn(),
}));

const mockQueryRequirements = queryRequirements as jest.Mock;

function createMockEvent(
    name: string,
    amount: number
): AppSyncResolverEvent<QueryRequirementArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryRequirementArgs>>();
    mockEvent.arguments = {
        name,
        amount,
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
            { name: "test", amount: 2 },
            { name: "test 2", amount: 5 },
        ],
        [
            { name: "test", amount: 2 },
            { name: "test 2", amount: 5 },
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
        const event = createMockEvent("test", 1);

        const actual = await handler(event);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    }
);

test("throws a user friendly error if an exception occurs while fetching item requirements", async () => {
    const expectedError = new Error(
        "An error occurred while fetching item requirements, please try again."
    );
    mockQueryRequirements.mockRejectedValue(new Error("unhandled"));
    const event = createMockEvent("test", 1);

    expect.assertions(1);
    await expect(handler(event)).rejects.toThrow(expectedError);
});
