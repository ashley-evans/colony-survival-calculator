import type { Item } from "../../../types";

type ItemOutputDetails = Pick<Item, "createTime" | "output" | "toolset">;

interface OutputDatabasePort {
    (input: { id: string; creatorID?: string }): Promise<ItemOutputDetails[]>;
}

export type { ItemOutputDetails, OutputDatabasePort };
