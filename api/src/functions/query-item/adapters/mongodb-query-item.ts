import client from "@colony-survival-calculator/mongodb-client";
import { Document, Filter } from "mongodb";

import type { Item } from "../../../types";
import type {
    QueryItemByCreatorCountSecondaryPort,
    QueryItemByFieldSecondaryPort,
} from "../interfaces/query-item-secondary-port";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const queryItemByField: QueryItemByFieldSecondaryPort = async (
    name,
    creator
) => {
    const db = (await client).db(databaseName);
    const collection = db.collection<Item>(itemCollectionName);
    const filter: Filter<Item> = {
        ...(name ? { name } : {}),
        ...(creator ? { creator } : {}),
    };

    return collection.find(filter).toArray();
};

const queryItemByCreatorCount: QueryItemByCreatorCountSecondaryPort = async (
    minimumCreators,
    name
) => {
    const db = (await client).db(databaseName);
    const collection = db.collection<Item>(itemCollectionName);
    const pipeline: Document[] = [
        {
            $group: {
                _id: "$name",
                recipes: {
                    $addToSet: "$$ROOT",
                },
                recipeCount: {
                    $sum: 1,
                },
            },
        },
        {
            $match: {
                recipeCount: {
                    $gte: minimumCreators,
                },
            },
        },
        {
            $unwind: {
                path: "$recipes",
            },
        },
        {
            $replaceRoot: {
                newRoot: "$recipes",
            },
        },
    ];

    if (name) {
        pipeline.unshift({ $match: { name } });
    }

    const items = collection.aggregate<Item>(pipeline);

    return items.toArray();
};

export { queryItemByField, queryItemByCreatorCount };
