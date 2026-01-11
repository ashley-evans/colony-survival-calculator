import client from "@colony-survival-calculator/mongodb-client";
import { Document } from "mongodb";

import type { Item, TranslatedItem } from "../../../types";
import type {
    QueryItemByCreatorCountSecondaryPort,
    QueryItemByFieldSecondaryPort,
} from "../interfaces/query-item-secondary-port";
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

const queryItemByField: QueryItemByFieldSecondaryPort = async (
    locale,
    id,
    creatorID,
) => {
    const db = (await client).db(databaseName);
    const collection = db.collection<Item>(itemCollectionName);
    const pipeline: Document[] = [
        {
            $match: {
                ...(id ? { id } : {}),
                ...(creatorID ? { creatorID } : {}),
            },
        },
        getTranslationProjection(locale),
    ];

    return collection.aggregate<TranslatedItem>(pipeline).toArray();
};

const queryItemByCreatorCount: QueryItemByCreatorCountSecondaryPort = async (
    locale,
    minimumCreators,
    id,
) => {
    const db = (await client).db(databaseName);
    const collection = db.collection<Item>(itemCollectionName);
    const pipeline: Document[] = [
        {
            $group: {
                _id: "$id",
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
        getTranslationProjection(locale),
    ];

    if (id) {
        pipeline.unshift({ $match: { id } });
    }

    return collection.aggregate<TranslatedItem>(pipeline).toArray();
};

export { queryItemByField, queryItemByCreatorCount };
