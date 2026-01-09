import type { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { vi } from "vitest";

import {
    createItem,
    createMemoryServer,
    createTranslatedItem,
} from "../../../../../test/index";
import type { Item, Items } from "../../../../types";

const databaseName = "TestDatabase";
const itemCollectionName = "Items";

let mongoDBMemoryServer: MongoMemoryServer;

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

function createItemWithNumberOfRecipes(
    itemID: string,
    amount: number,
    locales: string[] = ["en-US"],
): Items {
    const items: Items = [];
    for (let i = 0; i < amount; i++) {
        items.push(
            createItem({
                id: itemID,
                createTime: 1,
                output: 1,
                requirements: [],
                creatorID: `${itemID}-creator-${i + 1}`,
                i18n: locales.reduce(
                    (acc, locale) => {
                        acc.name[locale] =
                            `Item ${itemID} Name ${i + 1} (${locale})`;
                        acc.creator[locale] =
                            `Item ${itemID} Creator ${i + 1} (${locale})`;
                        return acc;
                    },
                    { name: {}, creator: {} } as Item["i18n"],
                ),
            }),
        );
    }

    return items;
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
            await import("../mongodb-query-item");
        }).rejects.toThrow(expectedError);
    },
);

describe("field queries", () => {
    test("returns an empty array if no items are stored in the items collection", async () => {
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField("en-US");

        expect(actual).toEqual([]);
    });

    test.each([
        [
            "a single item",
            "en-US",
            [
                createItem({
                    id: "testitem1",
                    createTime: 2,
                    output: 3,
                    requirements: [{ id: "test", amount: 1 }],
                }),
            ],
        ],
        [
            "multiple items",
            "en-US",
            [
                createItem({
                    id: "testitem1",
                    createTime: 2,
                    output: 3,
                    requirements: [{ id: "test", amount: 1 }],
                }),
                createItem({
                    id: "testitem2",
                    createTime: 1,
                    output: 4,
                    requirements: [{ id: "world", amount: 3 }],
                }),
            ],
        ],
        [
            "multiple items",
            "fr-FR",
            [
                createItem({
                    id: "testitem1",
                    createTime: 2,
                    output: 3,
                    requirements: [{ id: "test", amount: 1 }],
                    i18n: {
                        name: {
                            "en-US": "test item 1",
                            "fr-FR": "article de test 1",
                        },
                        creator: {
                            "en-US": "test creator 1",
                            "fr-FR": "créateur de test 1",
                        },
                    },
                }),
                createItem({
                    id: "testitem2",
                    createTime: 1,
                    output: 4,
                    requirements: [{ id: "world", amount: 3 }],
                    i18n: {
                        name: {
                            "en-US": "test item 2",
                            "fr-FR": "article de test 2",
                        },
                        creator: {
                            "en-US": "test creator 2",
                            "fr-FR": "créateur de test 2",
                        },
                    },
                }),
            ],
        ],
    ])(
        "returns an array with all stored items given a %s (%s) is stored in the item collection",
        async (_: string, locale: string, stored: Items) => {
            await storeItems(stored);
            const expected = stored.map((item) =>
                createTranslatedItem(item, locale),
            );
            const { queryItemByField } = await import("../mongodb-query-item");

            const actual = await queryItemByField(locale);

            expect(actual).toHaveLength(expected.length);
            expect(actual).toEqual(expect.arrayContaining(expected));
        },
    );

    test("returns default (English) translations for items when requested locale not available", async () => {
        const stored = [
            createItem({
                id: "testitem1",
                createTime: 2,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "English Item 1" },
                    creator: { "en-US": "English Creator 1" },
                },
            }),
            createItem({
                id: "testitem2",
                createTime: 5,
                output: 3,
                requirements: [],
                i18n: {
                    name: { "en-US": "English Item 2" },
                    creator: { "en-US": "English Creator 2" },
                },
            }),
        ];
        await storeItems(stored);
        const expected = stored.map((item) =>
            createTranslatedItem(item, "en-US"),
        );
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField("de-DE");

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    });

    test.each(["en-US", "fr-FR"])(
        "returns only the specified item (%s) given an item ID provided and multiple items in collection",
        async (locale: string) => {
            const expectedItemID = "expected test item 1";
            const expected = createItem({
                id: expectedItemID,
                createTime: 2,
                output: 3,
                requirements: [{ id: "test", amount: 1 }],
                i18n: {
                    name: {
                        "en-US": "expected test item 1",
                        "fr-FR": "article de test attendu 1",
                    },
                    creator: {
                        "en-US": "expected test creator 1",
                        "fr-FR": "créateur de test attendu 1",
                    },
                },
            });
            const stored = [
                createItem({
                    id: "anotheritem",
                    createTime: 3,
                    output: 5,
                    requirements: [],
                }),
                expected,
            ];
            await storeItems(stored);
            const { queryItemByField } = await import("../mongodb-query-item");

            const actual = await queryItemByField(locale, expectedItemID);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(createTranslatedItem(expected, locale));
        },
    );

    test.each(["en-US", "fr-FR"])(
        "returns only items (%s) related to specified creator ID given multiple items from different creators in collection",
        async (locale: string) => {
            const expectedCreatorID = "testitemcreator";
            const expected = createItem({
                id: "testitem1",
                createTime: 2,
                output: 2,
                requirements: [],
                creatorID: expectedCreatorID,
                i18n: {
                    name: {
                        "en-US": "test item 1",
                        "fr-FR": "article de test 1",
                    },
                    creator: {
                        "en-US": "test creator",
                        "fr-FR": "créateur de test",
                    },
                },
            });
            const stored = [
                createItem({
                    id: "anotheritem",
                    createTime: 3,
                    output: 5,
                    requirements: [],
                }),
                expected,
            ];
            await storeItems(stored);
            const { queryItemByField } = await import("../mongodb-query-item");

            const actual = await queryItemByField(
                locale,
                undefined,
                expectedCreatorID,
            );

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(createTranslatedItem(expected, locale));
        },
    );

    test("returns only specific item created by specific creator if both item ID and creator ID provided", async () => {
        const expectedItemID = "testitem1";
        const expectedCreatorID = "testitemcreator";
        const expected = createItem({
            id: expectedItemID,
            createTime: 2,
            output: 2,
            requirements: [],
            creatorID: expectedCreatorID,
        });
        const stored = [
            createItem({
                id: "anotheritem",
                createTime: 3,
                output: 5,
                requirements: [],
                creatorID: "adifferentcreator",
            }),
            expected,
        ];
        await storeItems(stored);
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField(
            "en-US",
            undefined,
            expectedCreatorID,
        );

        expect(actual).toHaveLength(1);
        expect(actual[0]).toEqual(createTranslatedItem(expected, "en-US"));
    });

    test("returns no items if no stored items match the provided item ID in collection", async () => {
        const stored = createItem({
            id: "anotheritem",
            createTime: 3,
            output: 5,
            requirements: [],
        });
        await storeItems([stored]);
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField("en-US", "unknown item");

        expect(actual).toHaveLength(0);
    });

    test("returns no items if no stored items are created by provided creator ID in collection", async () => {
        const stored = createItem({
            id: "anotheritem",
            createTime: 3,
            output: 5,
            requirements: [],
        });
        await storeItems([stored]);
        const { queryItemByField } = await import("../mongodb-query-item");

        const actual = await queryItemByField(
            "en-US",
            undefined,
            "unknown creator",
        );

        expect(actual).toHaveLength(0);
    });
});

describe("creator count queries", () => {
    test("returns an empty array if no items are stored in the items collection", async () => {
        const { queryItemByCreatorCount } =
            await import("../mongodb-query-item");

        const actual = await queryItemByCreatorCount("en-US", 2);

        expect(actual).toEqual([]);
    });

    test.each(["en-US", "fr-FR"])(
        "returns only items (%s) with more than two creators if minimum of two specified",
        async (locale: string) => {
            const expected = createItemWithNumberOfRecipes(
                "expecteditemw/2recipes",
                2,
                ["en-US", "fr-FR"],
            );
            const stored = [
                createItem({
                    id: "anotheritem",
                    createTime: 3,
                    output: 5,
                    requirements: [],
                }),
                ...expected,
            ];
            await storeItems(stored);
            const { queryItemByCreatorCount } =
                await import("../mongodb-query-item");

            const actual = await queryItemByCreatorCount(locale, 2);

            expect(actual).toHaveLength(expected.length);
            expect(actual).toEqual(
                expect.arrayContaining(
                    expected.map((item) => createTranslatedItem(item, locale)),
                ),
            );
        },
    );

    test("returns only items with more than three creators if minimum of three specified", async () => {
        const expected = createItemWithNumberOfRecipes(
            "expected item w/ 3 recipes",
            3,
        );
        const stored = [
            ...createItemWithNumberOfRecipes("itemw/2recipes", 2),
            ...expected,
        ];
        await storeItems(stored);
        const { queryItemByCreatorCount } =
            await import("../mongodb-query-item");

        const actual = await queryItemByCreatorCount("en-US", 3);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(
            expect.arrayContaining(
                expected.map((item) => createTranslatedItem(item, "en-US")),
            ),
        );
    });

    test.each(["en-US", "fr-FR"])(
        "returns only items with specified ID (%s) given multiple items with minimum creator requirement",
        async (locale: string) => {
            const expectedItemID = "expecteditemw/3recipes";
            const expected = createItemWithNumberOfRecipes(expectedItemID, 3, [
                "en-US",
                "fr-FR",
            ]);
            const stored = [
                ...createItemWithNumberOfRecipes("anotheritemw/3recipes", 3),
                ...expected,
            ];
            await storeItems(stored);
            const { queryItemByCreatorCount } =
                await import("../mongodb-query-item");

            const actual = await queryItemByCreatorCount(
                locale,
                3,
                expectedItemID,
            );

            expect(actual).toHaveLength(expected.length);
            expect(actual).toEqual(
                expect.arrayContaining(
                    expected.map((item) => createTranslatedItem(item, locale)),
                ),
            );
        },
    );

    test("falls back to default (English) translations when requested locale not available given items with minimum creator requirement", async () => {
        const stored = createItemWithNumberOfRecipes("itemw/3recipes", 3, [
            "en-US",
        ]);
        await storeItems(stored);
        const expected = stored.map((item) =>
            createTranslatedItem(item, "en-US"),
        );
        const { queryItemByCreatorCount } =
            await import("../mongodb-query-item");

        const actual = await queryItemByCreatorCount("de-DE", 3);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    });

    test("returns no items if no item matches the specified ID given items with minimum creator requirement", async () => {
        const stored = createItemWithNumberOfRecipes("itemw/3recipes", 3);
        await storeItems(stored);
        const { queryItemByCreatorCount } =
            await import("../mongodb-query-item");

        const actual = await queryItemByCreatorCount("en-US", 3, "unknown");

        expect(actual).toHaveLength(0);
    });
});

afterAll(async () => {
    const client = await (
        await import("@colony-survival-calculator/mongodb-client")
    ).default;
    await client.close(true);
    await mongoDBMemoryServer.stop();
});
