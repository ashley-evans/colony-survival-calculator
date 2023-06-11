import {
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";
import { Item, Items, Tools } from "../../../types";
import {
    queryItemByCreatorCount,
    queryItemByField,
} from "../adapters/mongodb-query-item";
import type {
    QueryFilters,
    QueryItemPrimaryPort,
} from "../interfaces/query-item-primary-port";

const INVALID_FILTER_ERROR =
    "Invalid filter combination provided: Cannot filter by minimum creator and creator name";

function calculateOutput(
    item: Pick<Item, "maximumTool" | "createTime" | "output">,
    maxAvailableTool: Tools
): number {
    const modifier = getMaxToolModifier(item.maximumTool, maxAvailableTool);
    return item.output / (item.createTime / modifier);
}

function filterByOptimal(items: Items, maxAvailableTool?: Tools): Items {
    const itemMap = new Map<string, Item>();
    for (const item of items) {
        if (
            maxAvailableTool &&
            !isAvailableToolSufficient(item.minimumTool, maxAvailableTool)
        ) {
            continue;
        }

        const currentOptimalItem = itemMap.get(item.name);
        if (!currentOptimalItem) {
            itemMap.set(item.name, item);
            continue;
        }

        const currentOptimalOutput = calculateOutput(
            currentOptimalItem,
            maxAvailableTool ?? currentOptimalItem.maximumTool
        );
        const itemOutput = calculateOutput(
            item,
            maxAvailableTool ?? item.maximumTool
        );

        if (itemOutput > currentOptimalOutput) {
            itemMap.set(item.name, item);
        }
    }

    return Array.from(itemMap.values());
}

const queryItem: QueryItemPrimaryPort = async (
    filters: QueryFilters | undefined
) => {
    if (filters?.minimumCreators && filters.creator) {
        console.error(INVALID_FILTER_ERROR);
        throw new Error(INVALID_FILTER_ERROR);
    }

    try {
        const items = await (filters?.minimumCreators
            ? queryItemByCreatorCount(filters.minimumCreators, filters.name)
            : queryItemByField(filters?.name, filters?.creator));

        if (filters?.optimal) {
            return filterByOptimal(items, filters.optimal.maxAvailableTool);
        }

        return items;
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { queryItem };
