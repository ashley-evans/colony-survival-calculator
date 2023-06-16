import client from "@colony-survival-calculator/mongodb-client";

import type { Item } from "../../../types";
import type { RequirementsDatabasePort } from "../interfaces/requirements-database-port";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const queryRequirements: RequirementsDatabasePort = async (name: string) => {
    const db = (await client).db(databaseName);
    const collection = db.collection<Item>(itemCollectionName);

    const requirements = collection.aggregate<Item>([
        {
            $match: {
                name,
            },
        },
        {
            $graphLookup: {
                from: itemCollectionName,
                startWith: "$name",
                connectFromField: "requires.name",
                connectToField: "name",
                as: "result",
                depthField: "depth",
            },
        },
        {
            $unwind: {
                path: "$result",
            },
        },
        {
            $replaceRoot: {
                newRoot: "$result",
            },
        },
        {
            $group: {
                _id: {
                    name: "$name",
                    creator: "$creator",
                },
                unique: {
                    $addToSet: "$$ROOT",
                },
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    $arrayElemAt: ["$unique", 0],
                },
            },
        },
        {
            $sort: {
                depth: 1,
            },
        },
        {
            $project: {
                _id: 0,
                depth: 0,
            },
        },
    ]);

    return requirements.toArray();
};

export { queryRequirements };
