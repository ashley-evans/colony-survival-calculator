import client from "@colony-survival-calculator/mongodb-client";

import type { Item } from "../../../types";
import type {
    ItemOutputDetails,
    OutputDatabasePort,
} from "../interfaces/output-database-port";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const queryOutputDetails: OutputDatabasePort = async ({ name, creator }) => {
    const db = (await client).db(databaseName);
    const collection = db.collection(itemCollectionName);

    return collection
        .find<Item>({
            ...(name ? { name } : {}),
            ...(creator ? { creator } : {}),
        })
        .project<ItemOutputDetails>({
            _id: 0,
            createTime: 1,
            output: 1,
            minimumTool: 1,
            maximumTool: 1,
        })
        .toArray();
};

export { queryOutputDetails };
