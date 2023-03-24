import { handler } from "../handler";
import { queryItem } from "../domain/query-item";
import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";
import type { Items } from "../../../types";
import { createItem } from "../../../../test";

jest.mock("../domain/query-item", () => ({
    queryItem: jest.fn(),
}));

const mockQueryItem = queryItem as jest.Mock;
const mockEvent = mock<AppSyncResolverEvent<void>>();

beforeEach(() => {
    mockQueryItem.mockReset();
});

test("calls the domain to fetch all known items", async () => {
    await handler(mockEvent);

    expect(mockQueryItem).toHaveBeenCalledTimes(1);
});

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

        const actual = await handler(mockEvent);

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
    await expect(handler(mockEvent)).rejects.toThrow(expectedError);
});
