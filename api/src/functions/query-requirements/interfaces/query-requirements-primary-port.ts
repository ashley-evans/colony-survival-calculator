import { OutputUnit } from "../../../common/output";
import { Tools } from "../../../types";

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

interface QueryRequirementsPrimaryPort {
    (input: {
        name: string;
        workers: number;
        unit?: OutputUnit;
        maxAvailableTool?: Tools;
        creatorOverrides?: CreatorOverride[];
    }): Promise<Requirement[]>;
}

export type {
    CreatorOverride,
    Requirement,
    RequirementRecipe,
    Demand,
    QueryRequirementsPrimaryPort,
};
