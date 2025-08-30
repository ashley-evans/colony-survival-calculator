import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { vi } from "vitest";

import { createItem, createMemoryServer } from "../../../../../test/index";
import type { Items } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

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

function createItemWithNumberOfRecipes(
    itemName: string,
    amount: number,
): Items {
    const items: Items = [];
    for (let i = 0; i < amount; i++) {
        items.push(
            createItem({
                name: itemName,
                createTime: 1,
                output: 1,
                requirements: [],
                creator: `${itemName}-creator-${i + 1}`,
            }),
        );
    }

    return items;
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
            await import("../mongodb-query-item");
        }).rejects.toThrow(expectedError);
    },
);

describe("field queries", () => {
    test("returns an empty array if no items are stored in the items collection", async () => {
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField();

        expect(actual).toEqual([]);
    });

    test.each([
        [
            "a single item",
            [
                createItem({
                    name: "test item 1",
                    createTime: 2,
                    output: 3,
                    requirements: [{ name: "test", amount: 1 }],
                }),
            ],
        ],
        [
            "multiple items",
            [
                createItem({
                    name: "test item 1",
                    createTime: 2,
                    output: 3,
                    requirements: [{ name: "test", amount: 1 }],
                }),
                createItem({
                    name: "test item 2",
                    createTime: 1,
                    output: 4,
                    requirements: [{ name: "world", amount: 3 }],
                }),
            ],
        ],
    ])(
        "returns an array with all stored items given a %s is stored in the item collection",
        async (_: string, expected: Items) => {
            await storeItems(expected);
            const { queryItemByField } = await import("../mongodb-query-item");

            const actual = await queryItemByField();

            expect(actual).toHaveLength(expected.length);
            expect(actual).toEqual(expect.arrayContaining(expected));
        },
    );

    test("returns only the specified item given an item name provided and multiple items in collection", async () => {
        const expectedItemName = "expected test item 1";
        const expected = createItem({
            name: expectedItemName,
            createTime: 2,
            output: 3,
            requirements: [{ name: "test", amount: 1 }],
        });
        const stored = [
            createItem({
                name: "another item",
                createTime: 3,
                output: 5,
                requirements: [],
            }),
            expected,
        ];
        await storeItems(stored);
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField(expectedItemName);

        expect(actual).toHaveLength(1);
        expect(actual[0]).toEqual(expected);
    });

    test("returns only items related to specified creator given multiple items from different creators in collection", async () => {
        const expectedCreator = "test item creator";
        const expected = createItem({
            name: "test item",
            createTime: 2,
            output: 2,
            requirements: [],
            creator: expectedCreator,
        });
        const stored = [
            createItem({
                name: "another item",
                createTime: 3,
                output: 5,
                requirements: [],
            }),
            expected,
        ];
        await storeItems(stored);
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField(undefined, expectedCreator);

        expect(actual).toHaveLength(1);
        expect(actual[0]).toEqual(expected);
    });

    test("returns only specific item created by specific creator if both item name and creator provided", async () => {
        const expectedItemName = "test item";
        const expectedCreator = "test item creator";
        const expected = createItem({
            name: expectedItemName,
            createTime: 2,
            output: 2,
            requirements: [],
            creator: expectedCreator,
        });
        const stored = [
            createItem({
                name: expectedItemName,
                createTime: 3,
                output: 5,
                requirements: [],
                creator: "a different creator",
            }),
            expected,
        ];
        await storeItems(stored);
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField(undefined, expectedCreator);

        expect(actual).toHaveLength(1);
        expect(actual[0]).toEqual(expected);
    });

    test("returns no items if no stored items match the provided item name in collection", async () => {
        const stored = createItem({
            name: "another item",
            createTime: 3,
            output: 5,
            requirements: [],
        });
        await storeItems([stored]);
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField("unknown item");

        expect(actual).toHaveLength(0);
    });

    test("returns no items if no stored items are created by provided creator in collection", async () => {
        const stored = createItem({
            name: "another item",
            createTime: 3,
            output: 5,
            requirements: [],
        });
        await storeItems([stored]);
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField(undefined, "unknown creator");

        expect(actual).toHaveLength(0);
    });
});

describe("creator count queries", () => {
    test("returns an empty array if no items are stored in the items collection", async () => {
        const { queryItemByCreatorCount } = await import(
            "../mongodb-query-item"
        );

        const actual = await queryItemByCreatorCount(2);

        expect(actual).toEqual([]);
    });

    test("returns only items with more than two creators if minimum of two specified", async () => {
        const expected = createItemWithNumberOfRecipes(
            "expected item w/ two recipes",
            2,
        );
        const stored = [
            createItem({
                name: "another item",
                createTime: 3,
                output: 5,
                requirements: [],
            }),
            ...expected,
        ];
        await storeItems(stored);
        const { queryItemByCreatorCount } = await import(
            "../mongodb-query-item"
        );

        const actual = await queryItemByCreatorCount(2);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    });

    test("returns only items with more than three creators if minimum of three specified", async () => {
        const expected = createItemWithNumberOfRecipes(
            "expected item w/ 3 recipes",
            3,
        );
        const stored = [
            ...createItemWithNumberOfRecipes("item w/ 2 recipes", 2),
            ...expected,
        ];
        await storeItems(stored);
        const { queryItemByCreatorCount } = await import(
            "../mongodb-query-item"
        );

        const actual = await queryItemByCreatorCount(3);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    });

    test("returns only items with specified name given multiple items with minimum creator requirement", async () => {
        const expectedItemName = "expected item w/ 3 recipes";
        const expected = createItemWithNumberOfRecipes(expectedItemName, 3);
        const stored = [
            ...createItemWithNumberOfRecipes("another item w/ 3 recipes", 3),
            ...expected,
        ];
        await storeItems(stored);
        const { queryItemByCreatorCount } = await import(
            "../mongodb-query-item"
        );

        const actual = await queryItemByCreatorCount(3, expectedItemName);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    });

    test("returns no items if no item matches the specified name given items with minimum creator requirement", async () => {
        const stored = createItemWithNumberOfRecipes("item w/ 3 recipes", 3);
        await storeItems(stored);
        const { queryItemByCreatorCount } = await import(
            "../mongodb-query-item"
        );

        const actual = await queryItemByCreatorCount(3, "unknown");

        expect(actual).toHaveLength(0);
    });
});

afterAll(async () => {
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    await client.close(true);
    await mongoDBMemoryServer.stop();
});
