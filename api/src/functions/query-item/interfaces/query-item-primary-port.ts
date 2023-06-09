import type { Items } from "../../../types";

type QueryFilters = {
    name?: string | undefined;
    minimumCreators?: number | undefined;
};

interface QueryItemPrimaryPort {
    (filters?: QueryFilters): Promise<Items>;
}

export type { QueryItemPrimaryPort, QueryFilters };
