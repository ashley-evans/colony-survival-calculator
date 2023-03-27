import type { Items } from "../../../types";

interface RequirementsDatabasePort {
    (name: string): Promise<Items>;
}

export type { RequirementsDatabasePort };
