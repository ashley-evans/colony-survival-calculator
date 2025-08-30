import { vi, Mock } from "vitest";

import { queryDistinctItemNames as dbQueryItemNames } from "../../adapters/mongodb-distinct-item-name-adapter";
import { queryDistinctItemNames as domain } from "../query-distinct-item-names";

vi.mock("../../adapters/mongodb-distinct-item-name-adapter", () => ({
    queryDistinctItemNames: vi.fn(),
}));

const mockQueryDistinctItemNames = dbQueryItemNames as Mock;

beforeEach(() => {
    mockQueryDistinctItemNames.mockReset();
});

test("calls the database to fetch all distinct item names", async () => {
    await domain();

    expect(mockQueryDistinctItemNames).toHaveBeenCalledTimes(1);
});

test.each([
    ["nothing", []],
    ["multiple item names", ["test item 1", "test item 2"]],
])(
    "returns provided distinct item names given %s returned from database",
    async (_: string, expected: string[]) => {
        mockQueryDistinctItemNames.mockResolvedValue(expected);

        const actual = await domain();

        expect(actual).toEqual(expect.arrayContaining(expected));
    },
);

test("throws an error if any unhandled exceptions occur while querying distinct item names from database", async () => {
    const expectedError = new Error("test error");
    mockQueryDistinctItemNames.mockRejectedValue(expectedError);

    expect.assertions(1);
    await expect(domain()).rejects.toThrowError(expectedError);
});
