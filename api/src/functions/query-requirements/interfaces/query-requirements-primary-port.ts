type Requirement = {
    name: string;
    amount: number;
};

interface QueryRequirementsPrimaryPort {
    (name: string, amount: number): Promise<Requirement[]>;
}

export type { Requirement, QueryRequirementsPrimaryPort };
