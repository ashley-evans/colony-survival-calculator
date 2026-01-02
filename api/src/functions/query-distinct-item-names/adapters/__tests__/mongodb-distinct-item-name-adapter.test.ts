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

    const actual = await queryDistinctItemNames();

    expect(actual).toEqual([]);
});

test.each([
    [
        "a single item name",
        "one item",
        [
            createItem({
                name: "test item 1",
                createTime: 5,
                output: 3,
                requirements: [],
            }),
        ],
        ["test item 1"],
    ],
    [
        "all item names",
        "multiple none duplicate items",
        [
            createItem({
                name: "test item 1",
                createTime: 5,
                output: 3,
                requirements: [],
            }),
            createItem({
                name: "test item 2",
                createTime: 5,
                output: 3,
                requirements: [],
            }),
        ],
        ["test item 1", "test item 2"],
    ],
    [
        "distinct item names",
        "multiple duplicate items",
        [
            createItem({
                name: "test item 1",
                createTime: 5,
                output: 3,
                requirements: [],
                creator: "test creator 1",
            }),
            createItem({
                name: "test item 1",
                createTime: 5,
                output: 3,
                requirements: [],
                creator: "test creator 2",
            }),
            createItem({
                name: "test item 2",
                createTime: 5,
                output: 3,
                requirements: [],
                creator: "test creator 1",
            }),
            createItem({
                name: "test item 2",
                createTime: 5,
                output: 3,
                requirements: [],
                creator: "test creator 2",
            }),
        ],
        ["test item 1", "test item 2"],
    ],
])(
    "returns %s given %s stored in the database",
    async (_: string, __: string, items: Items, expected: string[]) => {
        await storeItems(items);
        const { queryDistinctItemNames } =
            await import("../mongodb-distinct-item-name-adapter");

        const actual = await queryDistinctItemNames();

        expect(actual).toEqual(expect.arrayContaining(expected));
    },
);

afterAll(async () => {
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    await client.close(true);
    await mongoDBMemoryServer.stop();
});
