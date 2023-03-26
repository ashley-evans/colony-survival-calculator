import type { Items } from "../../../types";

interface QueryItemSecondaryPort {
    (name?: string): Promise<Items>;
}

export type { QueryItemSecondaryPort };
