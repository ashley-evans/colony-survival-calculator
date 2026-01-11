import { vi, Mock } from "vitest";

import { queryDistinctItemNames as dbQueryItemNames } from "../../adapters/mongodb-distinct-item-name-adapter";
import { queryDistinctItemNames as domain } from "../query-distinct-item-names";
import { ItemName } from "../../../../graphql/schema";

vi.mock("../../adapters/mongodb-distinct-item-name-adapter", () => ({
    queryDistinctItemNames: vi.fn(),
}));

const mockQueryDistinctItemNames = dbQueryItemNames as Mock;

beforeEach(() => {
    mockQueryDistinctItemNames.mockReset();
});

test.each([
    ["(none specified)", undefined, "en-US"],
    ["(specified)", "fr-FR", "fr-FR"],
])(
    "calls the database to fetch all distinct item names %s",
    async (_: string, locale: string | undefined, expectedLocale: string) => {
        await domain(locale);

        expect(mockQueryDistinctItemNames).toHaveBeenCalledTimes(1);
        expect(mockQueryDistinctItemNames).toHaveBeenCalledWith(expectedLocale);
    },
);

test.each([
    ["nothing", []],
    [
        "multiple items",
        [
            { id: "item1", name: "test item 1" },
            { id: "item2", name: "test item 2" },
        ],
    ],
])(
    "returns provided distinct items given %s returned from database",
    async (_: string, expected: ItemName[]) => {
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
