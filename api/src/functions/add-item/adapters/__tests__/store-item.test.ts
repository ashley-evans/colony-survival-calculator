import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import { createItem } from "../../../../../test/index";
import type { Items } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;
let connection: MongoClient;

function getItemsCollection() {
    const db = connection.db(databaseName);
    return db.collection(itemCollectionName);
}

async function clearItemsCollection() {
    const db = connection.db(databaseName);

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

beforeAll(async () => {
    mongoDBMemoryServer = await MongoMemoryServer.create({
        binary: {
            version: "6.0.4",
        },
        instance: {
            dbName: databaseName,
        },
    });

    connection = await MongoClient.connect(mongoDBMemoryServer.getUri());
}, 10000);

beforeEach(async () => {
    process.env["DATABASE_NAME"] = databaseName;
    process.env["ITEM_COLLECTION_NAME"] = "Items";
    process.env["MONGO_DB_URI"] = mongoDBMemoryServer.getUri();
    process.env["AWS_ACCESS_KEY_ID"] = "test_access_key_id";
    process.env["AWS_SECRET_ACCESS_KEY"] = "test_secret_access_key";
    process.env["TEST_ENV"] = "true";

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
    [
        "mongodb URI",
        "MONGO_DB_URI",
        "Misconfigured: URI for MongoDB not provided",
    ],
    [
        "AWS access key ID",
        "AWS_ACCESS_KEY_ID",
        "Misconfigured: AWS Access Key ID not provided",
    ],
    [
        "AWS secret access key",
        "AWS_SECRET_ACCESS_KEY",
        "Misconfigured: AWS Secret Access Key not provided",
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

        const itemsCollection = getItemsCollection();
        const items = await itemsCollection.find().toArray();
        expect(items).toHaveLength(0);
    });
});

describe.each([
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
])("handles adding %s", (_: string, expected: Items) => {
    test("returns success", async () => {
        const { storeItem } = await import("../store-item");

        const actual = await storeItem(expected);

        expect(actual).toBe(true);
    });

    test("adds the provided item(s) to the item collection", async () => {
        const { storeItem } = await import("../store-item");

        await storeItem(expected);

        const itemsCollection = getItemsCollection();
        const items = await itemsCollection.find().toArray();
        expect(items).toHaveLength(items.length);
        expect(items).toEqual(expect.arrayContaining(expected));
    });
});

test("removes any old entries prior to storing new items", async () => {
    const oldItem = createItem("old", 1, 2, []);
    const newItem = createItem("new", 2, 3, []);
    const { storeItem } = await import("../store-item");

    await storeItem([oldItem]);
    await storeItem([newItem]);

    const itemsCollection = getItemsCollection();
    const items = await itemsCollection.find().toArray();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(newItem);
});

afterAll(async () => {
    await mongoDBMemoryServer.stop();
});
