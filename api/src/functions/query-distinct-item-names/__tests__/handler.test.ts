import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "vitest-mock-extended";
import { vi, Mock } from "vitest";

import { handler } from "../handler";
import { queryDistinctItemNames } from "../domain/query-distinct-item-names";
import { ItemName, QueryDistinctItemNamesArgs } from "../../../graphql/schema";

vi.mock("../domain/query-distinct-item-names", () => ({
    queryDistinctItemNames: vi.fn(),
}));

const mockQueryDistinctItemNames = queryDistinctItemNames as Mock;

function createMockEvent(
    locale?: string,
): AppSyncResolverEvent<QueryDistinctItemNamesArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryDistinctItemNamesArgs>>();

    mockEvent.arguments = {
        locale: locale ?? null,
    };

    return mockEvent;
}

const validEvent = createMockEvent();

beforeEach(() => {
    mockQueryDistinctItemNames.mockReset();
});

test.each([
    ["(w/o locale)", undefined],
    ["(w/ locale)", "en-US"],
])(
    "calls the domain to fetch all distinct item names %s",
    async (_: string, locale: string | undefined) => {
        const event = createMockEvent(locale);

        await handler(event);

        expect(mockQueryDistinctItemNames).toHaveBeenCalledTimes(1);
        expect(mockQueryDistinctItemNames).toHaveBeenCalledWith(locale);
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
    "returns provided distinct items given %s returned",
    async (_: string, expected: ItemName[]) => {
        mockQueryDistinctItemNames.mockResolvedValue(expected);

        const actual = await handler(validEvent);

        expect(actual).toEqual(expect.arrayContaining(expected));
    },
);

test("throws an error if any unhandled exceptions occur while querying distinct item names", async () => {
    const expectedError = new Error("test error");
    mockQueryDistinctItemNames.mockRejectedValue(expectedError);

    expect.assertions(1);
    await expect(handler(validEvent)).rejects.toThrowError(expectedError);
});
