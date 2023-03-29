import type { Item } from "../../../types";

type ItemOutputDetails = Pick<Item, "createTime" | "output">;

interface OutputDatabasePort {
    (name: string): Promise<ItemOutputDetails[]>;
}

export type { ItemOutputDetails, OutputDatabasePort };
