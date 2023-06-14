import { Tools } from "../../../types";

type CreatorOverride = {
    itemName: string;
    creator: string;
};

type RequiredWorkers = {
    name: string;
    workers: number;
};

interface QueryRequirementsPrimaryPort {
    (
        name: string,
        workers: number,
        maxAvailableTool?: Tools,
        creatorOverrides?: CreatorOverride[]
    ): Promise<RequiredWorkers[]>;
}

export type { RequiredWorkers, QueryRequirementsPrimaryPort };
