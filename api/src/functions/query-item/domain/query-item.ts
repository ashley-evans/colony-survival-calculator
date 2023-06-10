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

const queryItem: QueryItemPrimaryPort = async (
    filters: QueryFilters | undefined
) => {
    if (filters?.minimumCreators && filters.creator) {
        console.error(INVALID_FILTER_ERROR);
        throw new Error(INVALID_FILTER_ERROR);
    }

    try {
        if (filters?.minimumCreators) {
            return await queryItemByCreatorCount(
                filters.minimumCreators,
                filters.name
            );
        }

        return await queryItemByField(filters?.name, filters?.creator);
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { queryItem };
