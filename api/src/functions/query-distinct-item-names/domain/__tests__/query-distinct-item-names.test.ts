import { vi, Mock } from "vitest";

import { queryDistinctItemNames as dbQueryItemNames } from "../../adapters/mongodb-distinct-item-name-adapter";
import { queryDistinctItemNames as domain } from "../query-distinct-item-names";
import { ItemName } from "../../../../graphql/schema";
import { ErrorCode, ERROR_MESSAGE_MAPPING } from "../../../../common";

vi.mock("../../adapters/mongodb-distinct-item-name-adapter", () => ({
    queryDistinctItemNames: vi.fn(),
}));

const mockQueryDistinctItemNames = dbQueryItemNames as Mock;
const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

beforeEach(() => {
    mockQueryDistinctItemNames.mockReset();
    consoleErrorSpy.mockClear();
});

test.each([
    ["(none specified)", undefined, "en-US"],
    ["(specified)", "fr-FR", "fr-FR"],
])(
    "calls the database to fetch all distinct item names %s",
    async (_: string, locale: string | undefined, expectedLocale: string) => {
        await domain(locale);

        expect(mockQueryDistinctItemNames).toHaveBeenCalledTimes(1);
        const actualLocale = mockQueryDistinctItemNames.mock
            .calls[0]?.[0] as Intl.Locale;
        expect(actualLocale).toBeInstanceOf(Intl.Locale);
        expect(actualLocale.toString()).toBe(expectedLocale);
    },
);

test("throws an error if the provided locale is not a valid BCP 47 language tag", async () => {
    const expectedError = new Error(
        ERROR_MESSAGE_MAPPING[ErrorCode.INTERNAL_SERVER_ERROR],
    );

    expect.assertions(2);
    await expect(domain("not-a-locale!")).rejects.toThrow(expectedError);
    expect(mockQueryDistinctItemNames).not.toHaveBeenCalled();
});

test("logs an error message to console if the provided locale is not a valid BCP 47 language tag", async () => {
    try {
        await domain("not-a-locale!");
    } catch {
        // Ignore
    }

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(RangeError));
});

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
    mockQueryDistinctItemNames.mockRejectedValue(new Error("test error"));
    const expectedError = new Error(
        ERROR_MESSAGE_MAPPING[ErrorCode.INTERNAL_SERVER_ERROR],
    );

    expect.assertions(1);
    await expect(domain()).rejects.toThrow(expectedError);
});

test("logs an error message to console if any unhandled exceptions occur while querying distinct item names from database", async () => {
    const expectedError = new Error("test error");
    mockQueryDistinctItemNames.mockRejectedValue(expectedError);

    try {
        await domain();
    } catch {
        // Ignore
    }

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError);
});
