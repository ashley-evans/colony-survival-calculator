import type { AvailableToolsInput, TranslatedItem } from "../../../types";

type QueryFilters = {
    id?: string | undefined;
    minimumCreators?: number | undefined;
    creatorID?: string | undefined;
    optimal?: AvailableToolsInput | undefined;
};

interface QueryItemPrimaryPort {
    (filters?: QueryFilters, locale?: string): Promise<TranslatedItem[]>;
}

export type { QueryItemPrimaryPort, QueryFilters };
