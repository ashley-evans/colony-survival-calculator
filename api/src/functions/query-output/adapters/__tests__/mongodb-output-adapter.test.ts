import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { vi } from "vitest";

import { createItem, createMemoryServer } from "../../../../../test/index";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

import { DefaultToolset } from "../../../../types";
import type { Items } from "../../../../types";
import type { ItemOutputDetails } from "../../interfaces/output-database-port";

const validItemID = "testitem";
const validCreatorID = "testitemcreator";

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
            await import("../mongodb-output-adapter");
        }).rejects.toThrow(expectedError);
    },
);

test("returns an empty array if no items are stored in the items collection", async () => {
    const { queryOutputDetails } = await import("../mongodb-output-adapter");

    const actual = await queryOutputDetails({ id: validItemID });

    expect(actual).toEqual([]);
});

test.each([
    [
        "only relevant item details",
        "only one item stored in database",
        [
            createItem({
                id: validItemID,
                createTime: 5,
                output: 3,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "copper" as DefaultToolset,
            }),
        ],
        [
            {
                createTime: 5,
                output: 3,
                toolset: {
                    type: "default" as const,
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "copper" as DefaultToolset,
                },
            },
        ],
    ],
    [
        "only relevant item details",
        "multiple items stored in database",
        [
            createItem({
                id: validItemID,
                creatorID: validCreatorID,
                createTime: 5,
                output: 3,
                requirements: [],
                minimumTool: "copper" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
            createItem({
                id: "anotheritem",
                createTime: 2,
                output: 1,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
        ],
        [
            {
                createTime: 5,
                output: 3,
                toolset: {
                    type: "default" as const,
                    minimumTool: "copper" as DefaultToolset,
                    maximumTool: "steel" as DefaultToolset,
                },
            },
        ],
    ],
    [
        "nothing",
        "no relevant items stored in database",
        [
            createItem({
                id: "anotheritem",
                createTime: 2,
                output: 1,
                requirements: [],
            }),
            createItem({
                id: "yetanotheritem",
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
        expected: ItemOutputDetails[],
    ) => {
        await storeItems(stored);
        const { queryOutputDetails } =
            await import("../mongodb-output-adapter");

        const actual = await queryOutputDetails({ id: validItemID });

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    },
);

test("only returns output details related to provided creator ID if item is created by more than one creator", async () => {
    const expected: ItemOutputDetails = {
        createTime: 1,
        output: 3,
        toolset: {
            type: "default",
            minimumTool: "stone" as DefaultToolset,
            maximumTool: "copper" as DefaultToolset,
        },
    };
    const expectedItem = createItem({
        id: validItemID,
        requirements: [],
        creatorID: validCreatorID,
        createTime: expected.createTime,
        output: expected.output,
        minimumTool: expected.toolset.minimumTool as DefaultToolset,
        maximumTool: expected.toolset.maximumTool as DefaultToolset,
    });
    const stored = [
        expectedItem,
        createItem({
            id: validItemID,
            createTime: 2,
            output: 4,
            requirements: [],
            creatorID: "anothercreator",
        }),
    ];
    await storeItems(stored);
    const { queryOutputDetails } = await import("../mongodb-output-adapter");

    const actual = await queryOutputDetails({
        id: validItemID,
        creatorID: validCreatorID,
    });

    expect(actual).toHaveLength(1);
    expect(actual[0]).toEqual(expected);
});

test("returns no output details if an item is not created by the provided creator", async () => {
    const stored = [
        createItem({
            id: validItemID,
            createTime: 2,
            output: 4,
            requirements: [],
            creatorID: "anothercreator",
        }),
    ];
    await storeItems(stored);
    const { queryOutputDetails } = await import("../mongodb-output-adapter");

    const actual = await queryOutputDetails({
        id: validItemID,
        creatorID: validCreatorID,
    });

    expect(actual).toHaveLength(0);
});

afterAll(async () => {
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    await client.close(true);
    await mongoDBMemoryServer.stop();
});
