import client from "@colony-survival-calculator/mongodb-client";

import { ItemDatabasePort } from "../interfaces/item-database-port";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const queryDistinctItemNames: ItemDatabasePort = async () => {
    const db = (await client).db(databaseName);
    const collection = db.collection(itemCollectionName);

    return collection.distinct("name");
};

export { queryDistinctItemNames };
