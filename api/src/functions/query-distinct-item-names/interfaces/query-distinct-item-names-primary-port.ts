import { ItemName } from "../../../graphql/schema";

interface QueryDistinctItemNamesPrimaryPort {
    (locale?: string): Promise<ItemName[]>;
}

export { QueryDistinctItemNamesPrimaryPort };
