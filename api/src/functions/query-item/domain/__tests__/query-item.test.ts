import {
    queryItemByField,
    queryItemByCreatorCount,
} from "../../adapters/mongodb-query-item";
import { queryItem } from "../query-item";
import type { Items } from "../../../../types";
import { createItem } from "../../../../../test";
import { QueryFilters } from "../../interfaces/query-item-primary-port";

jest.mock("../../adapters/mongodb-query-item", () => ({
    queryItemByField: jest.fn(),
    queryItemByCreatorCount: jest.fn(),
}));

const mockQueryItemByField = queryItemByField as jest.Mock;
const mockQueryItemByCreatorCount = queryItemByCreatorCount as jest.Mock;
const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

beforeEach(() => {
    mockQueryItemByField.mockReset();
    mockQueryItemByCreatorCount.mockReset();
    consoleErrorSpy.mockClear();
});

const expectedItemName = "expected item name";
const expectedMinimumCreators = 1;

describe("field queries", () => {
    test.each([
        ["all items", "no field filters provided", undefined, undefined],
        [
            "a specific item",
            "an item name provided",
            { name: expectedItemName },
            expectedItemName,
        ],
    ])(
        "queries the database via fields to fetch %s given %s",
        async (
            _: string,
            __: string,
            filters: QueryFilters | undefined,
            expected: string | undefined
        ) => {
            await queryItem(filters);

            expect(mockQueryItemByField).toHaveBeenCalledTimes(1);
            expect(mockQueryItemByField).toHaveBeenCalledWith(expected);
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
        "returns all items retrieved by field query given %s",
        async (_: string, received: Items) => {
            mockQueryItemByField.mockResolvedValue(received);

            const actual = await queryItem();

            expect(actual).toHaveLength(received.length);
            expect(actual).toEqual(expect.arrayContaining(received));
        }
    );

    test("throws an error if an exception occurs while fetching item details by field", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByField.mockRejectedValue(expectedError);

        expect.assertions(1);
        await expect(queryItem()).rejects.toThrow(expectedError);
    });

    test("logs an error message to console if an exception occurs while fetching item details by field", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByField.mockRejectedValue(expectedError);

        try {
            await queryItem();
        } catch {
            // Ignore
        }

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError);
    });
});

describe("creator count queries", () => {
    test.each([
        [
            "a minimum creator count filter is provided",
            { minimumCreators: expectedMinimumCreators },
            expectedMinimumCreators,
            undefined,
        ],
        [
            "a minimum creator count filter is provided w/ an item name",
            {
                minimumCreators: expectedMinimumCreators,
                name: expectedItemName,
            },
            expectedMinimumCreators,
            expectedItemName,
        ],
    ])(
        "queries the database via creator count given %s",
        async (
            _: string,
            filters: QueryFilters | undefined,
            expectedMinimumCreators: number,
            expectedItemName: string | undefined
        ) => {
            await queryItem(filters);

            expect(mockQueryItemByCreatorCount).toHaveBeenCalledTimes(1);
            expect(mockQueryItemByCreatorCount).toHaveBeenCalledWith(
                expectedMinimumCreators,
                expectedItemName
            );
        }
    );

    test.each([
        ["none received", []],
        [
            "multiple received",
            [
                createItem({
                    name: "test 1",
                    createTime: 1,
                    output: 3,
                    requirements: [],
                }),
                createItem({
                    name: "test 1",
                    createTime: 5,
                    output: 7,
                    requirements: [],
                }),
            ],
        ],
    ])(
        "returns all items retrieved given %s",
        async (_: string, received: Items) => {
            mockQueryItemByCreatorCount.mockResolvedValue(received);

            const actual = await queryItem({ minimumCreators: 1 });

            expect(actual).toHaveLength(received.length);
            expect(actual).toEqual(expect.arrayContaining(received));
        }
    );

    test("throws an error if an exception occurs while fetching item details", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByCreatorCount.mockRejectedValue(expectedError);

        expect.assertions(1);
        await expect(queryItem({ minimumCreators: 1 })).rejects.toThrow(
            expectedError
        );
    });

    test("logs an error message to console if an exception occurs while fetching item details", async () => {
        const expectedError = new Error("test error");
        mockQueryItemByCreatorCount.mockRejectedValue(expectedError);

        try {
            await queryItem({ minimumCreators: 1 });
        } catch {
            // Ignore
        }

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError);
    });
});
