import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import { createItem, createMemoryServer } from "../../../../../test/index";
import { Items, Tools } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";
const validItemName = "test item 1";

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
            await import("../mongodb-requirements-adapter");
        }).rejects.toThrow(expectedError);
    }
);

test("returns an empty array if no items are stored in the items collection", async () => {
    const { queryRequirements } = await import(
        "../mongodb-requirements-adapter"
    );

    const actual = await queryRequirements(validItemName);

    expect(actual).toEqual([]);
});

test("returns only the specified item if only that item is stored in the items collection", async () => {
    const stored = createItem({
        name: validItemName,
        createTime: 2,
        output: 3,
        requirements: [],
        minimumTool: Tools.none,
        maximumTool: Tools.steel,
    });
    await storeItems([{ ...stored }]);
    const { queryRequirements } = await import(
        "../mongodb-requirements-adapter"
    );

    const actual = await queryRequirements(validItemName);

    expect(actual).toHaveLength(1);
    expect(actual[0]).toEqual(stored);
});

test.each([
    [
        "an item with a single requirement and no nested requirements",
        [
            createItem({
                name: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: Tools.copper,
                maximumTool: Tools.steel,
            }),
            createItem({
                name: validItemName,
                createTime: 2,
                output: 4,
                requirements: [{ name: "required item 1", amount: 4 }],
                minimumTool: Tools.stone,
                maximumTool: Tools.steel,
            }),
        ],
        [
            createItem({
                name: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: Tools.copper,
                maximumTool: Tools.steel,
            }),
            createItem({
                name: validItemName,
                createTime: 2,
                output: 4,
                requirements: [{ name: "required item 1", amount: 4 }],
                minimumTool: Tools.stone,
                maximumTool: Tools.steel,
            }),
        ],
    ],
    [
        "an item with multiple requirements and no nested requirements",
        [
            createItem({
                name: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
            }),
            createItem({
                name: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
            }),
            createItem({
                name: validItemName,
                createTime: 2,
                output: 4,
                requirements: [
                    { name: "required item 1", amount: 4 },
                    { name: "required item 2", amount: 5 },
                ],
            }),
        ],
        [
            createItem({
                name: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
            }),
            createItem({
                name: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
            }),
            createItem({
                name: validItemName,
                createTime: 2,
                output: 4,
                requirements: [
                    { name: "required item 1", amount: 4 },
                    { name: "required item 2", amount: 5 },
                ],
            }),
        ],
    ],
    [
        "an item with multiple requirements and other unrelated items stored",
        [
            createItem({
                name: "unrelated item",
                createTime: 3,
                output: 2,
                requirements: [{ name: "required item 1", amount: 2 }],
            }),
            createItem({
                name: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
            }),
            createItem({
                name: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
            }),
            createItem({
                name: validItemName,
                createTime: 2,
                output: 4,
                requirements: [
                    { name: "required item 1", amount: 4 },
                    { name: "required item 2", amount: 5 },
                ],
            }),
        ],
        [
            createItem({
                name: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
            }),
            createItem({
                name: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
            }),
            createItem({
                name: validItemName,
                createTime: 2,
                output: 4,
                requirements: [
                    { name: "required item 1", amount: 4 },
                    { name: "required item 2", amount: 5 },
                ],
            }),
        ],
    ],
    [
        "an item with multiple nested requirements",
        [
            createItem({
                name: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
                minimumTool: Tools.none,
                maximumTool: Tools.steel,
            }),
            createItem({
                name: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [{ name: "required item 2", amount: 5 }],
                minimumTool: Tools.copper,
                maximumTool: Tools.bronze,
            }),
            createItem({
                name: validItemName,
                createTime: 2,
                output: 4,
                requirements: [{ name: "required item 1", amount: 4 }],
            }),
        ],
        [
            createItem({
                name: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
                minimumTool: Tools.none,
                maximumTool: Tools.steel,
            }),
            createItem({
                name: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [{ name: "required item 2", amount: 5 }],
                minimumTool: Tools.copper,
                maximumTool: Tools.bronze,
            }),
            createItem({
                name: validItemName,
                createTime: 2,
                output: 4,
                requirements: [{ name: "required item 1", amount: 4 }],
            }),
        ],
    ],
])(
    "returns flattened required items list given %s",
    async (_: string, stored: Items, expected: Items) => {
        await storeItems(stored);
        const { queryRequirements } = await import(
            "../mongodb-requirements-adapter"
        );

        const actual = await queryRequirements(validItemName);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    }
);

afterAll(async () => {
    (await mockClient).close(true);
    await mongoDBMemoryServer.stop();
});
