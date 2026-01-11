import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { vi } from "vitest";

import { createItem, createMemoryServer } from "../../../../../test/index";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

import { Items } from "../../../../types";

async function storeItems(items: Items) {
    const { storeItem } = await import("../../../add-item/adapters/store-item");
    await storeItem(items);
}

async function clearItemsCollection() {
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    const db = client.db(databaseName);

    const existingCollections = await db.listCollections().toArray();
    const collectionExists =
        existingCollections.find(
            (collection) => collection.name == itemCollectionName,
        ) !== undefined;
    if (collectionExists) {
        const itemsCollection = db.collection(itemCollectionName);
        await itemsCollection.drop();
    }
}

beforeAll(async () => {
    mongoDBMemoryServer = await createMemoryServer(databaseName);

    vi.doMock("@colony-survival-calculator/mongodb-client", async () => {
        const clientPromise = MongoClient.connect(mongoDBMemoryServer.getUri());
        return {
            default: clientPromise,
        };
    });
});

beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("DATABASE_NAME", databaseName);
    vi.stubEnv("ITEM_COLLECTION_NAME", itemCollectionName);

    await clearItemsCollection();
});

test.each([
    [
        "database name",
        "DATABASE_NAME",
        "Misconfigured: Database name not provided",
    ],
    [
        "item collection name",
        "ITEM_COLLECTION_NAME",
        "Misconfigured: Item collection name not provided",
    ],
])(
    "throws an error if %s configuration not provided",
    async (_: string, key: string, expectedError: string) => {
        delete process.env[key];

        expect.assertions(1);
        await expect(async () => {
            await import("../mongodb-distinct-item-name-adapter");
        }).rejects.toThrow(expectedError);
    },
);

test("returns an empty array if no items are stored in the items collection", async () => {
    const { queryDistinctItemNames } =
        await import("../mongodb-distinct-item-name-adapter");

    const actual = await queryDistinctItemNames("en-US");

    expect(actual).toEqual([]);
});

type ItemNamePair = { id: string; name: string };

test.each<[string, string, Items, string, ItemNamePair[]]>([
    [
        "a single item",
        "one item",
        [
            createItem({
                id: "testitem1",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "test item 1" },
                    creator: { "en-US": "test creator 1" },
                },
            }),
        ],
        "en-US",
        [{ id: "testitem1", name: "test item 1" }],
    ],
    [
        "all items",
        "multiple non-duplicate items",
        [
            createItem({
                id: "testitem1",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "test item 1" },
                    creator: { "en-US": "test creator 1" },
                },
            }),
            createItem({
                id: "testitem2",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "test item 2" },
                    creator: { "en-US": "test creator 2" },
                },
            }),
        ],
        "en-US",
        [
            { id: "testitem1", name: "test item 1" },
            { id: "testitem2", name: "test item 2" },
        ],
    ],
    [
        "distinct items",
        "multiple items with same id but different creators",
        [
            createItem({
                id: "testitem1",
                createTime: 5,
                output: 3,
                requirements: [],
                creatorID: "testcreator1",
                i18n: {
                    name: { "en-US": "test item 1" },
                    creator: { "en-US": "test creator 1" },
                },
            }),
            createItem({
                id: "testitem1",
                createTime: 5,
                output: 3,
                requirements: [],
                creatorID: "testcreator2",
                i18n: {
                    name: { "en-US": "test item 1" },
                    creator: { "en-US": "test creator 2" },
                },
            }),
            createItem({
                id: "testitem2",
                createTime: 5,
                output: 3,
                requirements: [],
                creatorID: "testcreator1",
                i18n: {
                    name: { "en-US": "test item 2" },
                    creator: { "en-US": "test creator 1" },
                },
            }),
            createItem({
                id: "testitem2",
                createTime: 5,
                output: 3,
                requirements: [],
                creatorID: "testcreator2",
                i18n: {
                    name: { "en-US": "test item 2" },
                    creator: { "en-US": "test creator 2" },
                },
            }),
        ],
        "en-US",
        [
            { id: "testitem1", name: "test item 1" },
            { id: "testitem2", name: "test item 2" },
        ],
    ],
    [
        "localized items for requested locale",
        "items with multiple locales",
        [
            createItem({
                id: "testitem1",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: {
                        "en-US": "English Item 1",
                        "de-DE": "German Item 1",
                    },
                    creator: {
                        "en-US": "English Creator",
                        "de-DE": "German Creator",
                    },
                },
            }),
            createItem({
                id: "testitem2",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: {
                        "en-US": "English Item 2",
                        "de-DE": "German Item 2",
                    },
                    creator: {
                        "en-US": "English Creator",
                        "de-DE": "German Creator",
                    },
                },
            }),
        ],
        "de-DE",
        [
            { id: "testitem1", name: "German Item 1" },
            { id: "testitem2", name: "German Item 2" },
        ],
    ],
    [
        "only items with the requested locale",
        "items where some are missing the requested locale",
        [
            createItem({
                id: "testitem1",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: {
                        "en-US": "English Item 1",
                        "de-DE": "German Item 1",
                    },
                    creator: {
                        "en-US": "English Creator",
                        "de-DE": "German Creator",
                    },
                },
            }),
            createItem({
                id: "testitem2",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "English Only Item" },
                    creator: { "en-US": "English Creator" },
                },
            }),
        ],
        "de-DE",
        [{ id: "testitem1", name: "German Item 1" }],
    ],
    [
        "no items",
        "items where none have the requested locale",
        [
            createItem({
                id: "testitem1",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "English Only Item 1" },
                    creator: { "en-US": "English Creator" },
                },
            }),
            createItem({
                id: "testitem2",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "English Only Item 2" },
                    creator: { "en-US": "English Creator" },
                },
            }),
        ],
        "de-DE",
        [],
    ],
])(
    "returns %s given %s stored in the database",
    async (
        _: string,
        __: string,
        items: Items,
        locale: string,
        expected: ItemNamePair[],
    ) => {
        await storeItems(items);
        const { queryDistinctItemNames } =
            await import("../mongodb-distinct-item-name-adapter");

        const actual = await queryDistinctItemNames(locale);

        expect(actual).toEqual(expect.arrayContaining(expected));
        expect(actual).toHaveLength(expected.length);
    },
);

describe("alphabetical ordering", () => {
    test("returns items in alphabetical order for en-US locale", async () => {
        const items = [
            createItem({
                id: "zebra",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "Zebra" },
                    creator: { "en-US": "creator" },
                },
            }),
            createItem({
                id: "apple",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "Apple" },
                    creator: { "en-US": "creator" },
                },
            }),
            createItem({
                id: "banana",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "Banana" },
                    creator: { "en-US": "creator" },
                },
            }),
        ];
        await storeItems(items);
        const { queryDistinctItemNames } =
            await import("../mongodb-distinct-item-name-adapter");

        const actual = await queryDistinctItemNames("en-US");

        expect(actual).toEqual([
            { id: "apple", name: "Apple" },
            { id: "banana", name: "Banana" },
            { id: "zebra", name: "Zebra" },
        ]);
    });

    test("returns items in locale-correct alphabetical order for German (ä after a)", async () => {
        const items = [
            createItem({
                id: "apfel",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "de-DE": "Apfel" },
                    creator: { "de-DE": "creator" },
                },
            }),
            createItem({
                id: "apfelsine",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "de-DE": "Äpfelsine" },
                    creator: { "de-DE": "creator" },
                },
            }),
            createItem({
                id: "banane",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "de-DE": "Banane" },
                    creator: { "de-DE": "creator" },
                },
            }),
        ];
        await storeItems(items);
        const { queryDistinctItemNames } =
            await import("../mongodb-distinct-item-name-adapter");

        const actual = await queryDistinctItemNames("de-DE");

        // In German locale, ä is sorted near a (not after z as in some other locales)
        expect(actual).toEqual([
            { id: "apfel", name: "Apfel" },
            { id: "apfelsine", name: "Äpfelsine" },
            { id: "banane", name: "Banane" },
        ]);
    });
});

afterAll(async () => {
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    await client.close(true);
    await mongoDBMemoryServer.stop();
});
