import { OutputUnit } from "../../../common";
import { DefaultToolset } from "../../../types";

type CreatorOverride = {
    itemName: string;
    creator: string;
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
    name: string;
    unit?: OutputUnit;
    maxAvailableTool?: DefaultToolset;
    hasMachineTools?: boolean;
    creatorOverrides?: CreatorOverride[];
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
