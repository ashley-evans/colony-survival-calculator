import { ItemName } from "../../../graphql/schema";

interface ItemDatabasePort {
    (locale: Intl.Locale): Promise<ItemName[]>;
}

export { ItemDatabasePort };
