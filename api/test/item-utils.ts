import {
    DefaultToolset,
    Item,
    OptionalOutput,
    Requirement,
    Requirements,
} from "../src/types";

function createRequirements(name: string, amount: number): Requirement {
    return {
        name,
        amount,
    };
}

function createOptionalOutput({
    name,
    amount,
    likelihood,
}: {
    name: string;
    amount: number;
    likelihood: number;
}): OptionalOutput {
    return {
        name,
        amount,
        likelihood,
    };
}

function createItem({
    name,
    createTime,
    output,
    requirements,
    minimumTool = DefaultToolset.none,
    maximumTool = DefaultToolset.none,
    creator = `${name} creator`,
    optionalOutputs,
    width,
    height,
}: {
    name: string;
    createTime: number;
    output: number;
    requirements: Requirements;
    minimumTool?: DefaultToolset;
    maximumTool?: DefaultToolset;
    creator?: string;
    optionalOutputs?: OptionalOutput[];
    width?: number;
    height?: number;
}): Item {
    return {
        name,
        createTime,
        output,
        creator,
        requires: requirements,
        ...(width && height ? { size: { width, height } } : {}),
        toolset: {
            type: "default",
            minimumTool,
            maximumTool,
        },
        ...(optionalOutputs ? { optionalOutputs } : {}),
    };
}

export { createItem, createRequirements, createOptionalOutput };
