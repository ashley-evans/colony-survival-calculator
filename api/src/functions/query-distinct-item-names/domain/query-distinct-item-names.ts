import { QueryDistinctItemNamesPrimaryPort } from "../interfaces/query-distinct-item-names-primary-port";
import { queryDistinctItemNames as dbQueryItemNames } from "../adapters/mongodb-distinct-item-name-adapter";
import { DEFAULT_LOCALE } from "../../../common";

const queryDistinctItemNames: QueryDistinctItemNamesPrimaryPort = async (
    locale?: string,
) => {
    return dbQueryItemNames(locale ?? DEFAULT_LOCALE);
};

export { queryDistinctItemNames };
