import { queryItem as mongoDBQueryItem } from "../../adapters/mongodb-query-item";
import { queryItem } from "../query-item";
import type { Items } from "../../../../types";
import { createItem } from "../../../../../test";

jest.mock("../../adapters/mongodb-query-item", () => ({
    queryItem: jest.fn(),
}));

const mockMongoDBQueryItem = mongoDBQueryItem as jest.Mock;
const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

beforeEach(() => {
    mockMongoDBQueryItem.mockReset();
    consoleErrorSpy.mockClear();
});

test("calls the secondary adapter to fetch all items", async () => {
    await queryItem();

    expect(mockMongoDBQueryItem).toHaveBeenCalledTimes(1);
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
        mockMongoDBQueryItem.mockResolvedValue(received);

        const actual = await queryItem();

        expect(actual).toHaveLength(received.length);
        expect(actual).toEqual(expect.arrayContaining(received));
    }
);

test("throws an error if an exception occurs while fetching item details", async () => {
    const expectedError = new Error("test error");
    mockMongoDBQueryItem.mockRejectedValue(expectedError);

    expect.assertions(1);
    await expect(queryItem()).rejects.toThrow(expectedError);
});

test("logs an error message to console if an exception occurs while fetching item details", async () => {
    const expectedError = new Error("test error");
    mockMongoDBQueryItem.mockRejectedValue(expectedError);

    try {
        await queryItem();
    } catch {
        // Ignore
    }

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError);
});
