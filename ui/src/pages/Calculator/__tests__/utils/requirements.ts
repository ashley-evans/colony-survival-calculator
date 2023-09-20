import {
    CreatorDemand,
    RequirementCreator,
    Requirement,
} from "../../../../graphql/__generated__/graphql";

function createCreatorDemands(name: string, amount: number): CreatorDemand {
    return {
        name,
        amount,
    };
}

function createRequirementCreator({
    recipeName,
    amount,
    workers,
    creator = `${recipeName} creator`,
    demands = [],
}: {
    recipeName: string;
    amount: number;
    workers: number;
    creator?: string;
    demands?: CreatorDemand[];
}): RequirementCreator {
    return {
        name: recipeName,
        creator,
        amount,
        workers,
        demands,
    };
}

function createRequirement({
    name,
    amount,
    creators,
}: {
    name: string;
    amount: number;
    creators: RequirementCreator[];
}): Requirement {
    return {
        name,
        amount,
        creators,
    };
}

export { createCreatorDemands, createRequirementCreator, createRequirement };
