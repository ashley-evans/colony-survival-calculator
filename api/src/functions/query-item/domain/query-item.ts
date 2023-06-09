import {
    queryItemByCreatorCount,
    queryItemByField,
} from "../adapters/mongodb-query-item";
import type {
    QueryFilters,
    QueryItemPrimaryPort,
} from "../interfaces/query-item-primary-port";

const queryItem: QueryItemPrimaryPort = async (
    filters: QueryFilters | undefined
) => {
    try {
        if (filters?.minimumCreators) {
            return await queryItemByCreatorCount(
                filters.minimumCreators,
                filters.name
            );
        }

        return await queryItemByField(filters?.name);
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { queryItem };
