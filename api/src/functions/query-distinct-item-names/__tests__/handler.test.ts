import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import { handler } from "../handler";
import { queryDistinctItemNames } from "../domain/query-distinct-item-names";

jest.mock("../domain/query-distinct-item-names", () => ({
    queryDistinctItemNames: jest.fn(),
}));

const mockQueryDistinctItemNames = queryDistinctItemNames as jest.Mock;

const validEvent = mock<AppSyncResolverEvent<never>>();

beforeEach(() => {
    mockQueryDistinctItemNames.mockReset();
});

test("calls the domain to fetch all distinct item names", async () => {
    await handler(validEvent);

    expect(mockQueryDistinctItemNames).toHaveBeenCalledTimes(1);
});

test.each([
    ["nothing", []],
    ["multiple item names", ["test item 1", "test item 2"]],
])(
    "returns provided distinct item names given %s returned",
    async (_: string, expected: string[]) => {
        mockQueryDistinctItemNames.mockResolvedValue(expected);

        const actual = await handler(validEvent);

        expect(actual).toEqual(expect.arrayContaining(expected));
    }
);

test("throws an error if any unhandled exceptions occur while querying distinct item names", async () => {
    const expectedError = new Error("test error");
    mockQueryDistinctItemNames.mockRejectedValue(expectedError);

    expect.assertions(1);
    await expect(handler(validEvent)).rejects.toThrowError(expectedError);
});
