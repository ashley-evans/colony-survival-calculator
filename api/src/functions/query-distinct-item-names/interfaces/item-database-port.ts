import { ItemName } from "../../../graphql/schema";

interface ItemDatabasePort {
    (locale: string): Promise<ItemName[]>;
}

export { ItemDatabasePort };
