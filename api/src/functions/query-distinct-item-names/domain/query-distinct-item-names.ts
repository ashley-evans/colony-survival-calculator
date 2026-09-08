import { QueryDistinctItemNamesPrimaryPort } from "../interfaces/query-distinct-item-names-primary-port";
import { queryDistinctItemNames as dbQueryItemNames } from "../adapters/mongodb-distinct-item-name-adapter";
import {
    DEFAULT_LOCALE,
    ErrorCode,
    ERROR_MESSAGE_MAPPING,
} from "../../../common";

const queryDistinctItemNames: QueryDistinctItemNamesPrimaryPort = async (
    locale?: string,
) => {
    try {
        const parsedLocale = new Intl.Locale(locale ?? DEFAULT_LOCALE);
        return await dbQueryItemNames(parsedLocale);
    } catch (ex) {
        console.error(ex);
        throw new Error(ERROR_MESSAGE_MAPPING[ErrorCode.INTERNAL_SERVER_ERROR]);
    }
};

export { queryDistinctItemNames };
