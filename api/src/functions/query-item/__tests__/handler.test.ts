import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import { handler } from "../handler";
import { queryItem } from "../domain/query-item";
import { Tools as DomainTools, type Items } from "../../../types";
import { createItem } from "../../../../test";
import type {
    ItemsFilters,
    OptimalFilter,
    QueryItemArgs,
    Tools,
} from "../../../graphql/schema";
import { QueryFilters } from "../interfaces/query-item-primary-port";

jest.mock("../domain/query-item", () => ({
    queryItem: jest.fn(),
}));

const mockQueryItem = queryItem as jest.Mock;

function createOptimalFilter(maxAvailableTool?: Tools): OptimalFilter {
    return {
        maxAvailableTool: maxAvailableTool ?? null,
    };
}

function createFilters({
    itemName,
    minimumCreators,
    creator,
    optimal,
}: {
    itemName?: string;
    minimumCreators?: number;
    creator?: string;
    optimal?: OptimalFilter;
}): ItemsFilters {
    return {
        name: itemName ?? null,
        minimumCreators: minimumCreators ?? null,
        creator: creator ?? null,
        optimal: optimal ?? null,
    };
}

function createMockEvent(
    filters?: ItemsFilters
): AppSyncResolverEvent<QueryItemArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryItemArgs>>();
    mockEvent.arguments = {
        filters: filters ?? null,
    };

    return mockEvent;
}

const expectedItemName = "test item";
const expectedMinimumCreators = 2;
const expectedCreator = "test item creator";
const mockEventWithoutFilters = createMockEvent();
const mockEventWithEmptyFilters = createMockEvent(createFilters({}));
const mockEventWithItemName = createMockEvent(
    createFilters({ itemName: expectedItemName })
);
const mockEventWithMinimumCreators = createMockEvent(
    createFilters({ minimumCreators: expectedMinimumCreators })
);
const mockEventWithCreator = createMockEvent(
    createFilters({ creator: expectedCreator })
);
const mockEventWithOptimalFilter = createMockEvent(
    createFilters({
        optimal: createOptimalFilter(),
    })
);
const mockEventWithOptimalFilterAndMaxTool = createMockEvent(
    createFilters({
        optimal: createOptimalFilter("COPPER"),
    })
);
const mockEventWithAllFilters = createMockEvent(
    createFilters({
        itemName: expectedItemName,
        minimumCreators: expectedMinimumCreators,
        creator: expectedCreator,
        optimal: createOptimalFilter("STEEL"),
    })
);

beforeEach(() => {
    mockQueryItem.mockReset();
});

test.each([
    ["no filters specified", mockEventWithoutFilters, undefined],
    [
        "no item name specified in filter",
        mockEventWithEmptyFilters,
        { name: undefined },
    ],
    [
        "an item name specified in filter",
        mockEventWithItemName,
        { name: expectedItemName },
    ],
    [
        "a minimum number of creators specified in filter",
        mockEventWithMinimumCreators,
        { minimumCreators: expectedMinimumCreators },
    ],
    [
        "a creator name specified in filter",
        mockEventWithCreator,
        { creator: expectedCreator },
    ],
    [
        "an optimal filter specified w/o max tool",
        mockEventWithOptimalFilter,
        { optimal: {} },
    ],
    [
        "an optimal filter specified w/ max tool",
        mockEventWithOptimalFilterAndMaxTool,
        { optimal: { maxAvailableTool: DomainTools.copper } },
    ],
    [
        "an item name, creator, and minimum number of creators specified in filter",
        mockEventWithAllFilters,
        {
            name: expectedItemName,
            minimumCreators: expectedMinimumCreators,
            creator: expectedCreator,
            optimal: { maxAvailableTool: DomainTools.steel },
        },
    ],
])(
    "calls the domain to fetch items given an event with %s",
    async (
        _: string,
        event: AppSyncResolverEvent<QueryItemArgs>,
        expected: QueryFilters | undefined
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
        mockQueryItem.mockResolvedValue(received);

        const actual = await handler(mockEventWithoutFilters);

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
    await expect(handler(mockEventWithoutFilters)).rejects.toThrow(
        expectedError
    );
});
