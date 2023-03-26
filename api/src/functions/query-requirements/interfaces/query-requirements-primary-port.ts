import type { Requirement } from "../../../types";

interface QueryRequirementsPrimaryPort {
    (name: string, amount: number): Promise<Requirement[]>;
}

export type { QueryRequirementsPrimaryPort };
