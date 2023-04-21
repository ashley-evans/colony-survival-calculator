import type { Item } from "../../../types";

type ItemOutputDetails = Pick<
    Item,
    "createTime" | "output" | "minimumTool" | "maximumTool"
>;

interface OutputDatabasePort {
    (name: string): Promise<ItemOutputDetails[]>;
}

export type { ItemOutputDetails, OutputDatabasePort };
