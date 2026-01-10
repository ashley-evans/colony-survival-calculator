import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

import {
    createItem,
    createMemoryServer,
    createTranslatedItem,
} from "../../../../../test/index";
import type { Items } from "../../../../types";
import { DefaultToolset } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";
const validItemID = "test item id";
const defaultLocale = "en-US";

let mongoDBMemoryServer: MongoMemoryServer;

async function storeItems(items: Items) {
    const { storeItem } = await import("../../../add-item/adapters/store-item");
    await storeItem(JSON.parse(JSON.stringify(items)));
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
            await import("../mongodb-requirements-adapter");
        }).rejects.toThrow(expectedError);
    },
);

test("returns an empty array if no items are stored in the items collection", async () => {
    const { queryRequirements } =
        await import("../mongodb-requirements-adapter");

    const actual = await queryRequirements({
        id: validItemID,
        locale: defaultLocale,
    });

    expect(actual).toEqual([]);
});

test("returns only the specified item if only that item is stored in the items collection", async () => {
    const stored = createItem({
        id: validItemID,
        createTime: 2,
        output: 3,
        requirements: [],
        minimumTool: "none" as DefaultToolset,
        maximumTool: "steel" as DefaultToolset,
    });
    await storeItems([stored]);
    const { queryRequirements } =
        await import("../mongodb-requirements-adapter");

    const actual = await queryRequirements({
        id: validItemID,
        locale: defaultLocale,
    });

    expect(actual).toHaveLength(1);
    expect(actual[0]).toEqual(
        createTranslatedItem({ item: stored, locale: defaultLocale }),
    );
});

test.each([
    [
        "an item with a single requirement and no nested requirements",
        [
            createItem({
                id: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: "copper" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
            createItem({
                id: validItemID,
                createTime: 2,
                output: 4,
                requirements: [{ id: "required item 1", amount: 4 }],
                minimumTool: "stone" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
        ],
        [
            createItem({
                id: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
                minimumTool: "copper" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
            createItem({
                id: validItemID,
                createTime: 2,
                output: 4,
                requirements: [{ id: "required item 1", amount: 4 }],
                minimumTool: "stone" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
        ],
    ],
    [
        "an item with multiple requirements and no nested requirements",
        [
            createItem({
                id: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
            }),
            createItem({
                id: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
            }),
            createItem({
                id: validItemID,
                createTime: 2,
                output: 4,
                requirements: [
                    { id: "required item 1", amount: 4 },
                    { id: "required item 2", amount: 5 },
                ],
            }),
        ],
        [
            createItem({
                id: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
            }),
            createItem({
                id: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
            }),
            createItem({
                id: validItemID,
                createTime: 2,
                output: 4,
                requirements: [
                    { id: "required item 1", amount: 4 },
                    { id: "required item 2", amount: 5 },
                ],
            }),
        ],
    ],
    [
        "an item with multiple requirements and other unrelated items stored",
        [
            createItem({
                id: "unrelated item",
                createTime: 3,
                output: 2,
                requirements: [{ id: "required item 1", amount: 2 }],
            }),
            createItem({
                id: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
            }),
            createItem({
                id: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
            }),
            createItem({
                id: validItemID,
                createTime: 2,
                output: 4,
                requirements: [
                    { id: "required item 1", amount: 4 },
                    { id: "required item 2", amount: 5 },
                ],
            }),
        ],
        [
            createItem({
                id: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
            }),
            createItem({
                id: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [],
            }),
            createItem({
                id: validItemID,
                createTime: 2,
                output: 4,
                requirements: [
                    { id: "required item 1", amount: 4 },
                    { id: "required item 2", amount: 5 },
                ],
            }),
        ],
    ],
    [
        "an item with multiple nested requirements",
        [
            createItem({
                id: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
            createItem({
                id: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [{ id: "required item 2", amount: 5 }],
                minimumTool: "copper" as DefaultToolset,
                maximumTool: "bronze" as DefaultToolset,
            }),
            createItem({
                id: validItemID,
                createTime: 2,
                output: 4,
                requirements: [{ id: "required item 1", amount: 4 }],
            }),
        ],
        [
            createItem({
                id: "required item 2",
                createTime: 3,
                output: 4,
                requirements: [],
                minimumTool: "none" as DefaultToolset,
                maximumTool: "steel" as DefaultToolset,
            }),
            createItem({
                id: "required item 1",
                createTime: 1,
                output: 2,
                requirements: [{ id: "required item 2", amount: 5 }],
                minimumTool: "copper" as DefaultToolset,
                maximumTool: "bronze" as DefaultToolset,
            }),
            createItem({
                id: validItemID,
                createTime: 2,
                output: 4,
                requirements: [{ id: "required item 1", amount: 4 }],
            }),
        ],
    ],
])(
    "returns flattened required items list given %s",
    async (_: string, stored: Items, expected: Items) => {
        await storeItems(stored);
        const { queryRequirements } =
            await import("../mongodb-requirements-adapter");

        const actual = await queryRequirements({
            id: validItemID,
            locale: defaultLocale,
        });

        const expectedTranslated = expected.map((item) =>
            createTranslatedItem({ item, locale: defaultLocale }),
        );
        expect(actual).toHaveLength(expectedTranslated.length);
        expect(actual).toEqual(expect.arrayContaining(expectedTranslated));
    },
);

test("removes duplicate items w/ same creator when input item has multiple creators that require the same item", async () => {
    const requiredItemID = "required item 1";
    const expected = [
        createItem({
            id: requiredItemID,
            createTime: 4,
            output: 2,
            requirements: [],
        }),
        createItem({
            id: validItemID,
            createTime: 1,
            output: 8,
            requirements: [{ id: requiredItemID, amount: 4 }],
            creatorID: "test creator 1",
        }),
        createItem({
            id: validItemID,
            createTime: 2,
            output: 4,
            requirements: [{ id: requiredItemID, amount: 2 }],
            creatorID: "test creator 2",
        }),
    ];
    await storeItems(expected);

    const { queryRequirements } =
        await import("../mongodb-requirements-adapter");

    const actual = await queryRequirements({
        id: validItemID,
        locale: defaultLocale,
    });

    const expectedTranslated = expected.map((item) =>
        createTranslatedItem({ item, locale: defaultLocale }),
    );
    expect(actual).toHaveLength(expectedTranslated.length);
    expect(actual).toEqual(expect.arrayContaining(expectedTranslated));
});

test("returns items with translations for specified locale", async () => {
    const stored = [
        createItem({
            id: "required item 1",
            createTime: 1,
            output: 2,
            requirements: [],
            i18n: {
                name: {
                    "en-US": "Required Item 1",
                    "fr-FR": "Article Requis 1",
                },
                creator: { "en-US": "Creator 1", "fr-FR": "Créateur 1" },
            },
        }),
        createItem({
            id: validItemID,
            createTime: 2,
            output: 4,
            requirements: [{ id: "required item 1", amount: 4 }],
            i18n: {
                name: { "en-US": "Test Item", "fr-FR": "Article de Test" },
                creator: {
                    "en-US": "Test Creator",
                    "fr-FR": "Créateur de Test",
                },
            },
        }),
    ];
    await storeItems(stored);
    const { queryRequirements } =
        await import("../mongodb-requirements-adapter");

    const actual = await queryRequirements({
        id: validItemID,
        locale: "fr-FR",
    });

    const expectedTranslated = stored.map((item) =>
        createTranslatedItem({ item, locale: "fr-FR" }),
    );
    expect(actual).toHaveLength(expectedTranslated.length);
    expect(actual).toEqual(expect.arrayContaining(expectedTranslated));
});

test("returns default (English) translations for items when requested locale not available", async () => {
    const stored = [
        createItem({
            id: "required item 1",
            createTime: 1,
            output: 2,
            requirements: [],
            i18n: {
                name: { "en-US": "Required Item 1" },
                creator: { "en-US": "Creator 1" },
            },
        }),
        createItem({
            id: validItemID,
            createTime: 2,
            output: 4,
            requirements: [{ id: "required item 1", amount: 4 }],
            i18n: {
                name: { "en-US": "Test Item" },
                creator: { "en-US": "Test Creator" },
            },
        }),
    ];
    await storeItems(stored);
    const { queryRequirements } =
        await import("../mongodb-requirements-adapter");

    const actual = await queryRequirements({
        id: validItemID,
        locale: "de-DE",
    });

    const expectedTranslated = stored.map((item) =>
        createTranslatedItem({ item, locale: "en-US" }),
    );
    expect(actual).toHaveLength(expectedTranslated.length);
    expect(actual).toEqual(expect.arrayContaining(expectedTranslated));
});

afterAll(async () => {
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    await client.close(true);
    await mongoDBMemoryServer.stop();
});
