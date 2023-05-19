import { QueryDistinctItemNamesPrimaryPort } from "../interfaces/query-distinct-item-names-primary-port";
import { queryDistinctItemNames as dbQueryItemNames } from "../adapters/mongodb-distinct-item-name-adapter";

const queryDistinctItemNames: QueryDistinctItemNamesPrimaryPort = async () => {
    return dbQueryItemNames();
};

export { queryDistinctItemNames };
