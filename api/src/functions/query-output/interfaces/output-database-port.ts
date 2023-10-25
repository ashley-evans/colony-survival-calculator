import type { Item } from "../../../types";

type ItemOutputDetails = Pick<Item, "createTime" | "output" | "toolset">;

interface OutputDatabasePort {
    (input: { name: string; creator?: string }): Promise<ItemOutputDetails[]>;
}

export type { ItemOutputDetails, OutputDatabasePort };
