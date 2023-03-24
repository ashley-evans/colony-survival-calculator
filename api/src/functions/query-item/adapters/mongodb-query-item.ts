import client from "@colony-survival-calculator/mongodb-client";
import type { Item } from "../../../types";

import type { QueryItemSecondaryPort } from "../interfaces/query-item-secondary-port";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const queryItem: QueryItemSecondaryPort = async () => {
    const db = (await client).db(databaseName);
    const collection = db.collection<Item>(itemCollectionName);
    return collection.find().toArray();
};

export { queryItem };
