import type { Items } from "../../../types";

interface QueryItemPrimaryPort {
    (name?: string): Promise<Items>;
}

export type { QueryItemPrimaryPort };
