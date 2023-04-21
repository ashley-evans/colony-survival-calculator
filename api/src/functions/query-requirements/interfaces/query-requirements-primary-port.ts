import { Tools } from "../../../types";

type RequiredWorkers = {
    name: string;
    workers: number;
};

interface QueryRequirementsPrimaryPort {
    (name: string, workers: number, maxAvailableTool?: Tools): Promise<
        RequiredWorkers[]
    >;
}

export type { RequiredWorkers, QueryRequirementsPrimaryPort };
