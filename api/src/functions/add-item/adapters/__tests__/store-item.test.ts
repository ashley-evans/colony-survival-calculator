import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import { createItem, createMemoryServer } from "../../../../../test/index";
import { Items, Tools } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

jest.mock("@colony-survival-calculator/mongodb-client", async () => {
    mongoDBMemoryServer = await createMemoryServer(databaseName);
    return MongoClient.connect(mongoDBMemoryServer.getUri());
});

import mockClient from "@colony-survival-calculator/mongodb-client";

async function getItemsCollection() {
    const client = await mockClient;
    const db = client.db(databaseName);
    return db.collection(itemCollectionName);
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
            await import("../store-item");
        }).rejects.toThrow(expectedError);
    }
);

describe("empty array handling", () => {
    test("returns success if provided an empty array", async () => {
        const { storeItem } = await import("../store-item");

        const actual = await storeItem([]);

        expect(actual).toBe(true);
    });

    test("adds no items to the items collection", async () => {
        const { storeItem } = await import("../store-item");

        await storeItem([]);

        const itemsCollection = await getItemsCollection();
        const items = await itemsCollection.find().toArray();
        expect(items).toHaveLength(0);
    });
});

describe.each([
    [
        "a single item",
        [
            createItem({
                name: "test item 1",
                createTime: 2,
                output: 3,
                requirements: [{ name: "test", amount: 1 }],
                minimumTool: Tools.none,
                maximumTool: Tools.steel,
                creator: "Test Creator 1",
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
                minimumTool: Tools.copper,
                maximumTool: Tools.bronze,
                creator: "Test Creator 1",
            }),
            createItem({
                name: "test item 2",
                createTime: 1,
                output: 4,
                requirements: [{ name: "world", amount: 3 }],
                minimumTool: Tools.none,
                maximumTool: Tools.steel,
                creator: "Test Creator 2",
            }),
        ],
    ],
])("handles adding %s", (_: string, expected: Items) => {
    test("returns success", async () => {
        const { storeItem } = await import("../store-item");

        const actual = await storeItem(expected);

        expect(actual).toBe(true);
    });

    test("adds the provided item(s) to the item collection", async () => {
        const { storeItem } = await import("../store-item");

        await storeItem(expected);

        const itemsCollection = await getItemsCollection();
        const items = await itemsCollection.find().toArray();
        expect(items).toHaveLength(items.length);
        expect(items).toEqual(expect.arrayContaining(expected));
    });
});

test("removes any old entries prior to storing new items", async () => {
    const oldItem = createItem({
        name: "old",
        createTime: 1,
        output: 2,
        requirements: [],
        minimumTool: Tools.none,
        maximumTool: Tools.none,
    });
    const newItem = createItem({
        name: "new",
        createTime: 2,
        output: 3,
        requirements: [],
        minimumTool: Tools.bronze,
        maximumTool: Tools.steel,
    });
    const { storeItem } = await import("../store-item");

    await storeItem([oldItem]);
    await storeItem([newItem]);

    const itemsCollection = await getItemsCollection();
    const items = await itemsCollection.find().toArray();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(newItem);
});

afterAll(async () => {
    (await mockClient).close(true);
    await mongoDBMemoryServer.stop();
});
