import client from "@colony-survival-calculator/mongodb-client";

import type { StoreItemPort } from "../interfaces/store-item-port";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const storeItem: StoreItemPort = async (items) => {
    if (items.length === 0) {
        return true;
    }

    const connection = await client;
    const db = connection.db(databaseName);
    const collection = db.collection(itemCollectionName);
    const session = connection.startSession();

    try {
        await session.withTransaction(
            async () => {
                await collection.deleteMany({}, { session });
                await collection.insertMany(items, { session });
            },
            {
                writeConcern: { w: "majority" },
            },
        );
    } finally {
        await session.endSession();
    }

    return true;
};

export { storeItem };
