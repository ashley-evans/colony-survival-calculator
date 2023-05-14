import {
    Item,
    OptionalOutput,
    Requirement,
    Requirements,
    Tools,
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
    minimumTool = Tools.none,
    maximumTool = Tools.none,
    creator = `${name}-creator`,
    optionalOutputs,
    width,
    height,
}: {
    name: string;
    createTime: number;
    output: number;
    requirements: Requirements;
    minimumTool?: Tools;
    maximumTool?: Tools;
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
        minimumTool,
        maximumTool,
        ...(optionalOutputs ? { optionalOutputs } : {}),
    };
}

export { createItem, createRequirements, createOptionalOutput };
