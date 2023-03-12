import { queryItem as mongoDBQueryItem } from "../adapters/mongodb-query-item";
import type { QueryItemPrimaryPort } from "../interfaces/query-item-primary-port";

const queryItem: QueryItemPrimaryPort = async () => {
    try {
        return await mongoDBQueryItem();
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { queryItem };
