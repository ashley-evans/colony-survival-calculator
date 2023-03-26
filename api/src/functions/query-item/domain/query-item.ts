import { queryItem as mongoDBQueryItem } from "../adapters/mongodb-query-item";
import type { QueryItemPrimaryPort } from "../interfaces/query-item-primary-port";

const queryItem: QueryItemPrimaryPort = async (name?: string) => {
    try {
        return await mongoDBQueryItem(name);
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { queryItem };
