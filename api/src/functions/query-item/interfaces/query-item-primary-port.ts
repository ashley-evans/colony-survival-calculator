import type { Items } from "../../../types";

interface QueryItemPrimaryPort {
    (): Promise<Items>;
}

export type { QueryItemPrimaryPort };
