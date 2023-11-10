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

type RequirementResult = {
    requirements: Requirement[];
    totalWorkers: number;
};

interface QueryRequirementsPrimaryPort {
    (input: {
        name: string;
        workers: number;
        unit?: OutputUnit;
        maxAvailableTool?: DefaultToolset;
        hasMachineTools?: boolean;
        creatorOverrides?: CreatorOverride[];
    }): Promise<RequirementResult>;
}

export type {
    CreatorOverride,
    Requirement,
    RequirementRecipe,
    Demand,
    RequirementResult,
    QueryRequirementsPrimaryPort,
};
