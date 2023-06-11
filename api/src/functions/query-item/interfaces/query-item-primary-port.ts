import type { Items, Tools } from "../../../types";

type OptimalFilter = {
    maxAvailableTool?: Tools | undefined;
};

type QueryFilters = {
    name?: string | undefined;
    minimumCreators?: number | undefined;
    creator?: string | undefined;
    optimal?: OptimalFilter | undefined;
};

interface QueryItemPrimaryPort {
    (filters?: QueryFilters): Promise<Items>;
}

export type { QueryItemPrimaryPort, QueryFilters, OptimalFilter };
