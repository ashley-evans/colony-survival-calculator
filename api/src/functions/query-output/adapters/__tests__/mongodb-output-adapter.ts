import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import { createItem, createMemoryServer } from "../../../../../test/index";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

jest.mock("@colony-survival-calculator/mongodb-client", async () => {
    mongoDBMemoryServer = await createMemoryServer(databaseName);
    return MongoClient.connect(mongoDBMemoryServer.getUri());
});

import mockClient from "@colony-survival-calculator/mongodb-client";
import { Items, DefaultToolset } from "../../../../types";
import type { ItemOutputDetails } from "../../interfaces/output-database-port";

const validItemName = "test item";
const validCreatorName = "a test item creator";

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

    const actual = await queryOutputDetails({ name: validItemName });

    expect(actual).toEqual([]);
});

test.each([
    [
        "only relevant item details",
        "only one item stored in database",
        [
            createItem({
                name: validItemName,
                createTime: 5,
                output: 3,
                requirements: [],
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.copper,
            }),
        ],
        [
            {
                createTime: 5,
                output: 3,
                toolset: {
                    type: "default" as const,
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.copper,
                },
            },
        ],
    ],
    [
        "only relevant item details",
        "multiple items stored in database",
        [
            createItem({
                name: validItemName,
                createTime: 5,
                output: 3,
                requirements: [],
                minimumTool: DefaultToolset.copper,
                maximumTool: DefaultToolset.steel,
            }),
            createItem({
                name: "another item",
                createTime: 2,
                output: 1,
                requirements: [],
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            }),
        ],
        [
            {
                createTime: 5,
                output: 3,
                toolset: {
                    type: "default" as const,
                    minimumTool: DefaultToolset.copper,
                    maximumTool: DefaultToolset.steel,
                },
            },
        ],
    ],
    [
        "nothing",
        "no relevant items stored in database",
        [
            createItem({
                name: "another item",
                createTime: 2,
                output: 1,
                requirements: [],
            }),
            createItem({
                name: "yet another item",
                createTime: 5,
                output: 3,
                requirements: [],
            }),
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

        const actual = await queryOutputDetails({ name: validItemName });

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    }
);

test("only returns output details related to provided creator if item is created by more than one creator", async () => {
    const expected: ItemOutputDetails = {
        createTime: 1,
        output: 3,
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.stone,
            maximumTool: DefaultToolset.copper,
        },
    };
    const expectedItem = createItem({
        name: validItemName,
        requirements: [],
        creator: validCreatorName,
        createTime: expected.createTime,
        output: expected.output,
        minimumTool: expected.toolset.minimumTool,
        maximumTool: expected.toolset.maximumTool,
    });
    const stored = [
        expectedItem,
        createItem({
            name: validItemName,
            createTime: 2,
            output: 4,
            requirements: [],
            creator: "another creator",
        }),
    ];
    await storeItems(stored);
    const { queryOutputDetails } = await import("../mongodb-output-adapter");

    const actual = await queryOutputDetails({
        name: validItemName,
        creator: validCreatorName,
    });

    expect(actual).toHaveLength(1);
    expect(actual[0]).toEqual(expected);
});

test("returns no output details if an item is not created by the provided creator", async () => {
    const stored = [
        createItem({
            name: validItemName,
            createTime: 2,
            output: 4,
            requirements: [],
            creator: "another creator",
        }),
    ];
    await storeItems(stored);
    const { queryOutputDetails } = await import("../mongodb-output-adapter");

    const actual = await queryOutputDetails({
        name: validItemName,
        creator: validCreatorName,
    });

    expect(actual).toHaveLength(0);
});

afterAll(async () => {
    (await mockClient).close(true);
    await mongoDBMemoryServer.stop();
});
