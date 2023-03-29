import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import { createItem, createMemoryServer } from "../../../../../test/index";
// import type { Items } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

jest.mock("@colony-survival-calculator/mongodb-client", async () => {
    mongoDBMemoryServer = await createMemoryServer(databaseName);
    return MongoClient.connect(mongoDBMemoryServer.getUri());
});

import mockClient from "@colony-survival-calculator/mongodb-client";
import type { Items } from "../../../../types";
import type { ItemOutputDetails } from "../../interfaces/output-database-port";

const validItemName = "test item";

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
    process.env["ITEM_COLLECTION_NAME"] = itemCollectionName;

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
            await import("../mongodb-output-adapter");
        }).rejects.toThrow(expectedError);
    }
);

test("returns an empty array if no items are stored in the items collection", async () => {
    const { queryOutputDetails } = await import("../mongodb-output-adapter");

    const actual = await queryOutputDetails(validItemName);

    expect(actual).toEqual([]);
});

test.each([
    [
        "only relevant item details",
        "only one item stored in database",
        [createItem(validItemName, 5, 3, [])],
        [{ createTime: 5, output: 3 }],
    ],
    [
        "only relevant item details",
        "multiple items stored in database",
        [
            createItem(validItemName, 5, 3, []),
            createItem("another item", 2, 1, []),
        ],
        [{ createTime: 5, output: 3 }],
    ],
    [
        "nothing",
        "no relevant items stored in database",
        [
            createItem("another item", 2, 1, []),
            createItem("yet another item", 5, 3, []),
        ],
        [],
    ],
])(
    "returns %s given %s",
    async (
        _: string,
        __: string,
        stored: Items,
        expected: ItemOutputDetails[]
    ) => {
        await storeItems(stored);
        const { queryOutputDetails } = await import(
            "../mongodb-output-adapter"
        );

        const actual = await queryOutputDetails(validItemName);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    }
);

afterAll(async () => {
    (await mockClient).close(true);
    await mongoDBMemoryServer.stop();
});
