import type { Items } from "../../../types";

interface QueryItemByFieldSecondaryPort {
    (name?: string, creator?: string): Promise<Items>;
}

interface QueryItemByCreatorCountSecondaryPort {
    (minimumCreators: number, name?: string): Promise<Items>;
}

export type {
    QueryItemByFieldSecondaryPort,
    QueryItemByCreatorCountSecondaryPort,
};
