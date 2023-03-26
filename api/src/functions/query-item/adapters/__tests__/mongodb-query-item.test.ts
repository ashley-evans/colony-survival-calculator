import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import { createItem, createMemoryServer } from "../../../../../test/index";
import type { Items } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

jest.mock("@colony-survival-calculator/mongodb-client", async () => {
    mongoDBMemoryServer = await createMemoryServer(databaseName);
    return MongoClient.connect(mongoDBMemoryServer.getUri());
});

import mockClient from "@colony-survival-calculator/mongodb-client";

async function storeItems(items: Items) {
    const { storeItem } = await import("../../../add-item/adapters/store-item");
    await storeItem(items);
}

async function clearItemsCollection() {
    const client = await mockClient;
    const db = client.db(databaseName);

    const existingCollections = await db.listCollections().toArray();
    const collectionExists =
        existingCollections.find(
            (collection) => collection.name == itemCollectionName
        ) !== undefined;
    if (collectionExists) {
        const itemsCollection = db.collection(itemCollectionName);
        await itemsCollection.drop();
    }
}

beforeEach(async () => {
    process.env["DATABASE_NAME"] = databaseName;
    process.env["ITEM_COLLECTION_NAME"] = "Items";

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
        delete process.env["TEST_ENV"];
        delete process.env[key];

        expect.assertions(1);
        await expect(async () => {
            await import("../mongodb-query-item");
        }).rejects.toThrow(expectedError);
    }
);

test("returns an empty array if no items are stored in the items collection", async () => {
    const { queryItem } = await import("../mongodb-query-item");

    const actual = await queryItem();

    expect(actual).toEqual([]);
});

test.each([
    [
        "a single item",
        [createItem("test item 1", 2, 3, [{ name: "test", amount: 1 }])],
    ],
    [
        "multiple items",
        [
            createItem("test item 1", 2, 3, [{ name: "test", amount: 1 }]),
            createItem("test item 2", 1, 4, [{ name: "world", amount: 3 }]),
        ],
    ],
])(
    "returns an array with all stored items given a %s is stored in the item collection",
    async (_: string, expected: Items) => {
        await storeItems(expected);
        const { queryItem } = await import("../mongodb-query-item");

        const actual = await queryItem();

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    }
);

test("returns only the specified item given an item name provided and multiple items in collection", async () => {
    const expectedItemName = "expected test item 1";
    const expected = createItem(expectedItemName, 2, 3, [
        { name: "test", amount: 1 },
    ]);
    const stored = [createItem("another item", 3, 5, []), expected];
    await storeItems(stored);
    const { queryItem } = await import("../mongodb-query-item");

    const actual = await queryItem(expectedItemName);

    expect(actual).toHaveLength(1);
    expect(actual[0]).toEqual(expected);
});

test("returns no items if no stored items match the provided item name in collection", async () => {
    const stored = createItem("another item", 3, 5, []);
    const expectedItemName = "expected test item 1";
    await storeItems([stored]);
    const { queryItem } = await import("../mongodb-query-item");

    const actual = await queryItem(expectedItemName);

    expect(actual).toHaveLength(0);
});

afterAll(async () => {
    (await mockClient).close(true);
    await mongoDBMemoryServer.stop();
});
