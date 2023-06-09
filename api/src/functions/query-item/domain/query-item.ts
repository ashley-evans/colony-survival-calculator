import { queryItem as mongoDBQueryItem } from "../adapters/mongodb-query-item";
import type {
    QueryFilters,
    QueryItemPrimaryPort,
} from "../interfaces/query-item-primary-port";

const queryItem: QueryItemPrimaryPort = async (
    filters: QueryFilters | undefined
) => {
    try {
        return await mongoDBQueryItem(filters?.name);
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { queryItem };
