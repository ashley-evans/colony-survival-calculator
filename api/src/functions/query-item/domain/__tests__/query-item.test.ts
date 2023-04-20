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

test.each([
    ["all items", "no item name provided", undefined],
    ["a specific item", "an item name provided", "expected item name"],
])(
    "calls the secondary adapter to fetch %s given %s",
    async (_: string, __: string, expected?: string) => {
        await queryItem(expected);

        expect(mockMongoDBQueryItem).toHaveBeenCalledTimes(1);
        expect(mockMongoDBQueryItem).toHaveBeenCalledWith(expected);
    }
);

test.each([
    ["none received", []],
    [
        "multiple received w/ no farm sizes",
        [
            createItem({
                name: "test 1",
                createTime: 1,
                output: 3,
                requirements: [],
            }),
            createItem({
                name: "test 2",
                createTime: 4,
                output: 6,
                requirements: [],
            }),
        ],
    ],
    [
        "multiple received w/ farm sizes",
        [
            createItem({
                name: "test 1",
                createTime: 1,
                output: 3,
                requirements: [],
                width: 1,
                height: 2,
            }),
            createItem({
                name: "test 2",
                createTime: 4,
                output: 6,
                requirements: [],
                width: 3,
                height: 4,
            }),
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
