import {
    calculateOutput,
    DEFAULT_LOCALE,
    isAvailableToolSufficient,
} from "../../../common";
import { DefaultToolset, TranslatedItem } from "../../../types";
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
    "Invalid filter combination provided: Cannot filter by minimum creator and creator ID";

function filterByOptimal(
    items: TranslatedItem[],
    filters: OptimalFilter,
): TranslatedItem[] {
    const itemMap = new Map<string, TranslatedItem>();
    const maxAvailableTool =
        filters.maxAvailableTool ?? ("steel" as DefaultToolset);
    const hasMachineTools = filters.hasMachineTools ?? true;
    const hasEyeglasses = filters.hasEyeglasses ?? true;

    for (const item of items) {
        if (
            !isAvailableToolSufficient({
                available: maxAvailableTool,
                hasMachineTools,
                hasEyeglasses,
                item,
            })
        ) {
            continue;
        }

        const currentOptimalItem = itemMap.get(item.id);
        if (!currentOptimalItem) {
            itemMap.set(item.id, item);
            continue;
        }

        const currentOptimalOutput = calculateOutput(
            currentOptimalItem,
            maxAvailableTool ?? currentOptimalItem.toolset.maximumTool,
        );
        const itemOutput = calculateOutput(
            item,
            maxAvailableTool ?? item.toolset.maximumTool,
        );

        if (itemOutput > currentOptimalOutput) {
            itemMap.set(item.name, item);
        }
    }

    return Array.from(itemMap.values());
}

const queryItem: QueryItemPrimaryPort = async (
    filters: QueryFilters | undefined,
    locale?: string,
) => {
    const finalLocale = locale ?? DEFAULT_LOCALE;
    if (filters?.minimumCreators && filters.creatorID) {
        console.error(INVALID_FILTER_ERROR);
        throw new Error(INVALID_FILTER_ERROR);
    }

    try {
        const items = await (filters?.minimumCreators
            ? queryItemByCreatorCount(
                  finalLocale,
                  filters.minimumCreators,
                  filters.id,
              )
            : queryItemByField(finalLocale, filters?.id, filters?.creatorID));

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
