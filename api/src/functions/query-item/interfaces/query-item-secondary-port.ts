import type { Items } from "../../../types";

interface QueryItemSecondaryPort {
    (): Promise<Items>;
}

export type { QueryItemSecondaryPort };
