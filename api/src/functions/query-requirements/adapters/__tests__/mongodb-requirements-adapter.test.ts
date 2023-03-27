import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import { createItem, createMemoryServer } from "../../../../../test/index";
import type { Items } from "../../../../types";

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
    const stored = createItem(validItemName, 2, 3, []);
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
            createItem("required item 1", 1, 2, []),
            createItem(validItemName, 2, 4, [
                { name: "required item 1", amount: 4 },
            ]),
        ],
        [
            createItem("required item 1", 1, 2, []),
            createItem(validItemName, 2, 4, [
                { name: "required item 1", amount: 4 },
            ]),
        ],
    ],
    [
        "an item with multiple requirements and no nested requirements",
        [
            createItem("required item 2", 3, 4, []),
            createItem("required item 1", 1, 2, []),
            createItem(validItemName, 2, 4, [
                { name: "required item 1", amount: 4 },
                { name: "required item 2", amount: 5 },
            ]),
        ],
        [
            createItem("required item 2", 3, 4, []),
            createItem("required item 1", 1, 2, []),
            createItem(validItemName, 2, 4, [
                { name: "required item 1", amount: 4 },
                { name: "required item 2", amount: 5 },
            ]),
        ],
    ],
    [
        "an item with multiple requirements and other unrelated items stored",
        [
            createItem("unrelated item", 3, 2, [
                { name: "required item 1", amount: 2 },
            ]),
            createItem("required item 2", 3, 4, []),
            createItem("required item 1", 1, 2, []),
            createItem(validItemName, 2, 4, [
                { name: "required item 1", amount: 4 },
                { name: "required item 2", amount: 5 },
            ]),
        ],
        [
            createItem("required item 2", 3, 4, []),
            createItem("required item 1", 1, 2, []),
            createItem(validItemName, 2, 4, [
                { name: "required item 1", amount: 4 },
                { name: "required item 2", amount: 5 },
            ]),
        ],
    ],
    [
        "an item with multiple nested requirements",
        [
            createItem("required item 2", 3, 4, []),
            createItem("required item 1", 1, 2, [
                { name: "required item 2", amount: 5 },
            ]),
            createItem(validItemName, 2, 4, [
                { name: "required item 1", amount: 4 },
            ]),
        ],
        [
            createItem("required item 2", 3, 4, []),
            createItem("required item 1", 1, 2, [
                { name: "required item 2", amount: 5 },
            ]),
            createItem(validItemName, 2, 4, [
                { name: "required item 1", amount: 4 },
            ]),
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
