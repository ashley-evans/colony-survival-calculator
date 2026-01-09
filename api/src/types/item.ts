import { Item } from "./__generated__/items";

type TranslatedItem = Omit<Item, "i18n"> & {
    name: string;
    creator: string;
};

export type { TranslatedItem };
