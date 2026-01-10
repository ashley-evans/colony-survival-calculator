import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "vitest-mock-extended";
import { vi, Mock } from "vitest";

import { handler } from "../handler";
import { queryItem } from "../domain/query-item";
import { DefaultToolset as DomainTools, TranslatedItem } from "../../../types";
import {
    createTranslatedItem,
    createTranslatedItemWithMachineTools,
} from "../../../../test";
import type {
    Item,
    ItemsFilters,
    OptimalFilter,
    QueryItemArgs,
    AvailableTools,
    Tools,
} from "../../../graphql/schema";
import { QueryFilters } from "../interfaces/query-item-primary-port";

vi.mock("../domain/query-item", () => ({
    queryItem: vi.fn(),
}));

const mockQueryItem = queryItem as Mock;

function createOptimalFilter(
    maxAvailableTool?: AvailableTools,
    hasMachineTools?: boolean,
): OptimalFilter {
    return {
        maxAvailableTool: maxAvailableTool ?? null,
        hasMachineTools: hasMachineTools ?? null,
    };
}

function createFilters({
    itemID,
    minimumCreators,
    creatorID,
    optimal,
}: {
    itemID?: string;
    minimumCreators?: number;
    creatorID?: string;
    optimal?: OptimalFilter;
}): ItemsFilters {
    return {
        id: itemID ?? null,
        minimumCreators: minimumCreators ?? null,
        creatorID: creatorID ?? null,
        optimal: optimal ?? null,
    };
}

function createMockEvent(
    filters?: ItemsFilters,
    locale?: string,
): AppSyncResolverEvent<QueryItemArgs> {
    const mockEvent = mock<AppSyncResolverEvent<QueryItemArgs>>();
    mockEvent.arguments = {
        filters: filters ?? null,
        locale: locale ?? null,
    };

    return mockEvent;
}

const expectedItemID = "testitem";
const expectedMinimumCreators = 2;
const expectedCreatorID = "testitemcreator";
const mockEventWithoutFilters = createMockEvent();
const mockEventWithEmptyFilters = createMockEvent(createFilters({}));
const mockEventWithItemID = createMockEvent(
    createFilters({ itemID: expectedItemID }),
);
const mockEventWithMinimumCreators = createMockEvent(
    createFilters({ minimumCreators: expectedMinimumCreators }),
);
const mockEventWithCreatorID = createMockEvent(
    createFilters({ creatorID: expectedCreatorID }),
);
const mockEventWithOptimalFilter = createMockEvent(
    createFilters({
        optimal: createOptimalFilter(),
    }),
);
const mockEventWithOptimalFilterAndMaxTool = createMockEvent(
    createFilters({
        optimal: createOptimalFilter("COPPER"),
    }),
);
const mockEventWithAllFilters = createMockEvent(
    createFilters({
        itemID: expectedItemID,
        minimumCreators: expectedMinimumCreators,
        creatorID: expectedCreatorID,
        optimal: createOptimalFilter("STEEL"),
    }),
);

beforeEach(() => {
    mockQueryItem.mockReset();
});

test.each([
    ["no filters specified", mockEventWithoutFilters, undefined, undefined],
    [
        "no item ID specified in filter",
        mockEventWithEmptyFilters,
        { id: undefined },
        undefined,
    ],
    [
        "an item ID specified in filter",
        mockEventWithItemID,
        { id: expectedItemID },
        undefined,
    ],
    [
        "a minimum number of creators specified in filter",
        mockEventWithMinimumCreators,
        { minimumCreators: expectedMinimumCreators },
        undefined,
    ],
    [
        "a creator ID specified in filter",
        mockEventWithCreatorID,
        { creatorID: expectedCreatorID },
        undefined,
    ],
    [
        "an optimal filter specified w/o max tool",
        mockEventWithOptimalFilter,
        { optimal: {} },
        undefined,
    ],
    [
        "an optimal filter specified w/ max tool",
        mockEventWithOptimalFilterAndMaxTool,
        { optimal: { maxAvailableTool: "copper" as DomainTools } },
        undefined,
    ],
    [
        "an item ID, creator ID, and minimum number of creators specified in filter",
        mockEventWithAllFilters,
        {
            id: expectedItemID,
            minimumCreators: expectedMinimumCreators,
            creatorID: expectedCreatorID,
            optimal: { maxAvailableTool: "steel" as DomainTools },
        },
        undefined,
    ],
    [
        "an optimal filter specified w/ machine tool indication (true)",
        createMockEvent(
            createFilters({
                optimal: createOptimalFilter(undefined, true),
            }),
        ),
        {
            optimal: { hasMachineTools: true },
        },
        undefined,
    ],
    [
        "an optimal filter specified w/ machine tool indication (false)",
        createMockEvent(
            createFilters({
                optimal: createOptimalFilter(undefined, false),
            }),
        ),
        {
            optimal: { hasMachineTools: false },
        },
        undefined,
    ],
    [
        "a locale specified",
        createMockEvent(undefined, "en-US"),
        undefined,
        "en-US",
    ],
    [
        "filters and locale specified",
        createMockEvent(createFilters({ itemID: expectedItemID }), "fr-FR"),
        { id: expectedItemID },
        "fr-FR",
    ],
    [
        "filters specified without locale",
        createMockEvent(createFilters({ itemID: expectedItemID })),
        { id: expectedItemID },
        undefined,
    ],
])(
    "calls the domain to fetch items given an event with %s",
    async (
        _: string,
        event: AppSyncResolverEvent<QueryItemArgs>,
        expectedFilters: QueryFilters | undefined,
        expectedLocale: string | undefined,
    ) => {
        mockQueryItem.mockResolvedValue([]);

        await handler(event);

        expect(mockQueryItem).toHaveBeenCalledTimes(1);
        expect(mockQueryItem).toHaveBeenCalledWith(
            expectedFilters,
            expectedLocale,
        );
    },
);

test.each([
    ["none received", [], []],
    [
        "multiple received w/ no farm sizes",
        [
            createTranslatedItem({
                name: "test 1",
                createTime: 1,
                output: 3,
                requirements: [],
                creator: "test 1 creator",
                minimumTool: "none" as DomainTools,
                maximumTool: "steel" as DomainTools,
            }),
            createTranslatedItem({
                name: "test 2",
                createTime: 4,
                output: 6,
                requirements: [],
                creator: "test 2 creator",
                minimumTool: "copper" as DomainTools,
                maximumTool: "bronze" as DomainTools,
            }),
            createTranslatedItemWithMachineTools({
                name: "test 3",
                creator: "test 3 creator",
                createTime: 6,
                output: 8,
                requirements: [],
            }),
        ],
        [
            {
                __typename: "Item" as const,
                id: "test1",
                name: "test 1",
                createTime: 1,
                output: 3,
                requires: [],
                creatorID: "test1creator",
                creator: "test 1 creator",
                minimumTool: "NONE" as Tools,
                maximumTool: "STEEL" as Tools,
            },
            {
                __typename: "Item" as const,
                id: "test2",
                name: "test 2",
                createTime: 4,
                output: 6,
                requires: [],
                creatorID: "test2creator",
                creator: "test 2 creator",
                minimumTool: "COPPER" as Tools,
                maximumTool: "BRONZE" as Tools,
            },
            {
                __typename: "Item" as const,
                id: "test3",
                name: "test 3",
                createTime: 6,
                output: 8,
                requires: [],
                creatorID: "test3creator",
                creator: "test 3 creator",
                minimumTool: "MACHINE" as Tools,
                maximumTool: "MACHINE" as Tools,
            },
        ],
    ],
    [
        "multiple received w/ farm sizes",
        [
            createTranslatedItem({
                name: "test 1",
                createTime: 1,
                output: 3,
                requirements: [],
                width: 1,
                height: 2,
                creator: "test 1 creator",
                minimumTool: "none" as DomainTools,
                maximumTool: "steel" as DomainTools,
            }),
            createTranslatedItem({
                name: "test 2",
                createTime: 4,
                output: 6,
                requirements: [],
                width: 3,
                height: 4,
                creator: "test 2 creator",
                minimumTool: "copper" as DomainTools,
                maximumTool: "bronze" as DomainTools,
            }),
            createTranslatedItemWithMachineTools({
                name: "test 3",
                creator: "test 3 creator",
                createTime: 6,
                output: 8,
                requirements: [],
                width: 5,
                height: 6,
            }),
        ],
        [
            {
                __typename: "Item" as const,
                id: "test1",
                name: "test 1",
                createTime: 1,
                output: 3,
                requires: [],
                size: {
                    width: 1,
                    height: 2,
                },
                creatorID: "test1creator",
                creator: "test 1 creator",
                minimumTool: "NONE" as Tools,
                maximumTool: "STEEL" as Tools,
            },
            {
                __typename: "Item" as const,
                id: "test2",
                name: "test 2",
                createTime: 4,
                output: 6,
                requires: [],
                size: {
                    width: 3,
                    height: 4,
                },
                creatorID: "test2creator",
                creator: "test 2 creator",
                minimumTool: "COPPER" as Tools,
                maximumTool: "BRONZE" as Tools,
            },
            {
                __typename: "Item" as const,
                id: "test3",
                name: "test 3",
                createTime: 6,
                output: 8,
                requires: [],
                size: {
                    width: 5,
                    height: 6,
                },
                creatorID: "test3creator",
                creator: "test 3 creator",
                minimumTool: "MACHINE" as Tools,
                maximumTool: "MACHINE" as Tools,
            },
        ],
    ],
])(
    "returns all items retrieved from domain given %s",
    async (_: string, received: TranslatedItem[], expected: Item[]) => {
        mockQueryItem.mockResolvedValue(received);

        const actual = await handler(mockEventWithoutFilters);

        expect(actual).toHaveLength(received.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    },
);

test("throws a user friendly error if an exception occurs while fetching item details", async () => {
    const expectedError = new Error(
        "An error occurred while fetching item details, please try again.",
    );
    mockQueryItem.mockRejectedValue(new Error("unhandled"));

    expect.assertions(1);
    await expect(handler(mockEventWithoutFilters)).rejects.toThrow(
        expectedError,
    );
});
