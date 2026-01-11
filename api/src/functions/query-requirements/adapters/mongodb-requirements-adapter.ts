import client from "@colony-survival-calculator/mongodb-client";
import { Document } from "mongodb";

import type { Item, TranslatedItem } from "../../../types";
import type { RequirementsDatabasePort } from "../interfaces/requirements-database-port";
import { DEFAULT_LOCALE } from "../../../common";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const getTranslationProjection = (locale: string): Document => {
    return {
        $project: {
            _id: 0,
            id: 1,
            createTime: 1,
            output: 1,
            requires: 1,
            toolset: 1,
            creatorID: 1,
            optionalOutputs: 1,
            size: 1,
            name: {
                $ifNull: [
                    `$i18n.name.${locale}`,
                    `$i18n.name.${DEFAULT_LOCALE}`,
                ],
            },
            creator: {
                $ifNull: [
                    `$i18n.creator.${locale}`,
                    `$i18n.creator.${DEFAULT_LOCALE}`,
                ],
            },
        },
    };
};

const queryRequirements: RequirementsDatabasePort = async ({ id, locale }) => {
    const db = (await client).db(databaseName);
    const collection = db.collection<Item>(itemCollectionName);

    const requirements = collection.aggregate<TranslatedItem>([
        {
            $match: {
                id,
            },
        },
        {
            $graphLookup: {
                from: itemCollectionName,
                startWith: "$id",
                connectFromField: "requires.id",
                connectToField: "id",
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
                    id: "$id",
                    creatorID: "$creatorID",
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
        getTranslationProjection(locale),
    ]);

    return requirements.toArray();
};

export { queryRequirements };
