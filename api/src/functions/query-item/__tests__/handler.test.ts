import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import { handler } from "../handler";
import { queryItem } from "../domain/query-item";
import type { Items } from "../../../types";
import { createItem } from "../../../../test";
import type { QueryItemArgs } from "../../../graphql/schema";

jest.mock("../domain/query-item", () => ({
    queryItem: jest.fn(),
}));

const mockQueryItem = queryItem as jest.Mock;

function createMockEvent(
    itemName?: string
): AppSyncResolverEvent<QueryItemArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryItemArgs>>();
    mockEvent.arguments = {
        name: itemName ?? null,
    };

    return mockEvent;
}

const expectedItemName = "test item";
const mockEventWithoutItemName = createMockEvent();
const mockEventWithItemName = createMockEvent(expectedItemName);

beforeEach(() => {
    mockQueryItem.mockReset();
});

test.each([
    [
        "all known items",
        "no item specified",
        mockEventWithoutItemName,
        undefined,
    ],
    [
        "a specific item",
        "a item name specified",
        mockEventWithItemName,
        expectedItemName,
    ],
])(
    "calls the domain to fetch %s given an event with %s",
    async (
        _: string,
        __: string,
        event: AppSyncResolverEvent<QueryItemArgs>,
        expected?: string
    ) => {
        await handler(event);

        expect(mockQueryItem).toHaveBeenCalledTimes(1);
        expect(mockQueryItem).toHaveBeenCalledWith(expected);
    }
);

test.each([
    ["none received", []],
    [
        "multiple received w/ no farm sizes",
        [createItem("test 1", 1, 3, []), createItem("test 2", 4, 6, [])],
    ],
    [
        "multiple received w/ farm sizes",
        [
            createItem("test 1", 1, 3, [], 1, 2),
            createItem("test 2", 4, 6, [], 3, 4),
        ],
    ],
])(
    "returns all items retrieved from domain given %s",
    async (_: string, received: Items) => {
        mockQueryItem.mockResolvedValue(received);

        const actual = await handler(mockEventWithoutItemName);

        expect(actual).toHaveLength(received.length);
        expect(actual).toEqual(expect.arrayContaining(received));
    }
);

test("throws a user friendly error if an exception occurs while fetching item details", async () => {
    const expectedError = new Error(
        "An error occurred while fetching item details, please try again."
    );
    mockQueryItem.mockRejectedValue(new Error("unhandled"));

    expect.assertions(1);
    await expect(handler(mockEventWithoutItemName)).rejects.toThrow(
        expectedError
    );
});
