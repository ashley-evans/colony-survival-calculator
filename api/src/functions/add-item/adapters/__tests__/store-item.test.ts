import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import { createItem, createMemoryServer } from "../../../../../test/index";
import { Items, DefaultToolset } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

async function getItemsCollection() {
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    const db = client.db(databaseName);
    return db.collection(itemCollectionName);
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
        delete process.env["TEST_ENV"];
        delete process.env[key];

        expect.assertions(1);
        await expect(async () => {
            await import("../store-item");
        }).rejects.toThrow(expectedError);
    },
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
                id: "testitem1",
                createTime: 2,
                output: 3,
                requirements: [{ id: "test", amount: 1 }],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
        ],
    ],
    [
        "multiple items",
        [
            createItem({
                id: "testitem1",
                createTime: 2,
                output: 3,
                requirements: [{ id: "test", amount: 1 }],
                minimumTool: "copper" as DefaultToolset,
                maximumTool: "bronze" as DefaultToolset,
            }),
            createItem({
                id: "testitem2",
                createTime: 1,
                output: 4,
                requirements: [{ id: "world", amount: 3 }],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
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
        id: "old",
        createTime: 1,
        output: 2,
        requirements: [],
        minimumTool: "none" as DefaultToolset,
        maximumTool: "none" as DefaultToolset,
    });
    const newItem = createItem({
        id: "new",
        createTime: 2,
        output: 3,
        requirements: [],
        minimumTool: "bronze" as DefaultToolset,
        maximumTool: "steel" as DefaultToolset,
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
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    await client.close(true);
    await mongoDBMemoryServer.stop();
});
