import {
    CreatorDemand,
    RequirementCreator,
    Requirement,
} from "../../../../graphql/__generated__/graphql";

function createCreatorDemands(name: string, amount: number): CreatorDemand {
    return {
        id: name.toLowerCase().replace(" ", ""),
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
        id: recipeName.toLowerCase().replace(" ", ""),
        name: recipeName,
        creator,
        creatorID: creator.toLowerCase().replace(" ", ""),
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
        id: name.toLowerCase().replace(" ", ""),
        name,
        amount,
        creators,
    };
}

export { createCreatorDemands, createRequirementCreator, createRequirement };
