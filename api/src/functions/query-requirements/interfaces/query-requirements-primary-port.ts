type RequiredWorkers = {
    name: string;
    workers: number;
};

interface QueryRequirementsPrimaryPort {
    (name: string, workers: number): Promise<RequiredWorkers[]>;
}

export type { RequiredWorkers, QueryRequirementsPrimaryPort };
