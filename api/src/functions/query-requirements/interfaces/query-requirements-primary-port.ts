import { OutputUnit } from "../../../common";
import { DefaultToolset } from "../../../types";

type CreatorOverride = {
    itemID: string;
    creatorID: string;
};

type Demand = {
    name: string;
    amount: number;
};

type RequirementRecipe = {
    name: string;
    creator: string;
    amount: number;
    workers: number;
    demands: Demand[];
};

type Requirement = {
    name: string;
    amount: number;
    creators: RequirementRecipe[];
};

type QueryRequirementsBaseParams = {
    id: string;
    unit?: OutputUnit;
    maxAvailableTool?: DefaultToolset;
    hasMachineTools?: boolean;
    creatorOverrides?: CreatorOverride[];
    locale?: string;
};

type QueryRequirementsTargetWorkers = QueryRequirementsBaseParams & {
    workers: number;
};

type QueryRequirementsTargetAmount = QueryRequirementsBaseParams & {
    amount: number;
};

type QueryRequirementsParams =
    | QueryRequirementsTargetWorkers
    | QueryRequirementsTargetAmount;

interface QueryRequirementsPrimaryPort {
    (input: QueryRequirementsParams): Promise<Requirement[]>;
}

export type {
    CreatorOverride,
    Requirement,
    RequirementRecipe,
    Demand,
    QueryRequirementsPrimaryPort,
    QueryRequirementsTargetWorkers,
    QueryRequirementsTargetAmount,
    QueryRequirementsParams,
};
