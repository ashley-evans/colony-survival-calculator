import { calculateOutput, isAvailableToolSufficient } from "../../../common";
import { Item, Items, DefaultToolset } from "../../../types";
import {
    queryItemByCreatorCount,
    queryItemByField,
} from "../adapters/mongodb-query-item";
import type {
    OptimalFilter,
    QueryFilters,
    QueryItemPrimaryPort,
} from "../interfaces/query-item-primary-port";

const INVALID_FILTER_ERROR =
    "Invalid filter combination provided: Cannot filter by minimum creator and creator name";

function filterByOptimal(items: Items, filters: OptimalFilter): Items {
    const itemMap = new Map<string, Item>();
    const maxAvailableTool = filters.maxAvailableTool ?? DefaultToolset.steel;
    const hasMachineTools = filters.hasMachineTools ?? true;
    const hasEyeglasses = filters.hasEyeglasses ?? true;

    for (const item of items) {
        if (
            !isAvailableToolSufficient(
                maxAvailableTool,
                hasMachineTools,
                hasEyeglasses,
                item
            )
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
            maxAvailableTool ?? currentOptimalItem.toolset.maximumTool
        );
        const itemOutput = calculateOutput(
            item,
            maxAvailableTool ?? item.toolset.maximumTool
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
            return filterByOptimal(items, filters.optimal);
        }

        return items;
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { queryItem };
