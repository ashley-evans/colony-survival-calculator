import client from "@colony-survival-calculator/mongodb-client";

import { ItemDatabasePort } from "../interfaces/item-database-port";
import { ItemName } from "../../../graphql/schema";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const queryDistinctItemNames: ItemDatabasePort = async (locale) => {
    const db = (await client).db(databaseName);
    const collection = db.collection(itemCollectionName);

    const results = await collection
        .aggregate<ItemName>([
            { $match: { [`i18n.name.${locale}`]: { $exists: true } } },
            {
                $group: {
                    _id: "$id",
                    name: { $first: `$i18n.name.${locale}` },
                },
            },
            { $project: { _id: 0, id: "$_id", name: 1 } },
        ])
        .toArray();

    return results.sort((a, b) =>
        a.name.localeCompare(b.name, locale, { sensitivity: "base" }),
    );
};

export { queryDistinctItemNames };
