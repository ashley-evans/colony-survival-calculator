import type { TranslatedItem } from "../../../types";

interface RequirementsDatabasePort {
    ({ id, locale }: { id: string; locale: string }): Promise<TranslatedItem[]>;
}

export type { RequirementsDatabasePort };
