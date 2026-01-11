import type { TranslatedItem } from "../../../types";

interface QueryItemByFieldSecondaryPort {
    (
        locale: string,
        id?: string,
        creatorID?: string,
    ): Promise<TranslatedItem[]>;
}

interface QueryItemByCreatorCountSecondaryPort {
    (
        locale: string,
        minimumCreators: number,
        id?: string,
    ): Promise<TranslatedItem[]>;
}

export type {
    QueryItemByFieldSecondaryPort,
    QueryItemByCreatorCountSecondaryPort,
};
