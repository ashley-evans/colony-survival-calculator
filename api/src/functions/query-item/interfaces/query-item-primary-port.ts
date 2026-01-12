import type { DefaultToolset, TranslatedItem } from "../../../types";

type OptimalFilter = {
    maxAvailableTool?: DefaultToolset | undefined;
    hasMachineTools?: boolean | undefined;
    hasEyeglasses?: boolean | undefined;
};

type QueryFilters = {
    id?: string | undefined;
    minimumCreators?: number | undefined;
    creatorID?: string | undefined;
    optimal?: OptimalFilter | undefined;
};

interface QueryItemPrimaryPort {
    (filters?: QueryFilters, locale?: string): Promise<TranslatedItem[]>;
}

export type { QueryItemPrimaryPort, QueryFilters, OptimalFilter };
