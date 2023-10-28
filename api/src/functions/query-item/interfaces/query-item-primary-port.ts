import type { Items, DefaultToolset } from "../../../types";

type OptimalFilter = {
    maxAvailableTool?: DefaultToolset | undefined;
    hasMachineTools?: boolean | undefined;
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
