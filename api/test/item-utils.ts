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

function createOptionalOutput(
    name: string,
    amount: number,
    likelihood: number
): OptionalOutput {
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
    optionalOutputs?: OptionalOutput[];
    width?: number;
    height?: number;
}): Item {
    return {
        name,
        createTime,
        output,
        requires: requirements,
        ...(width && height ? { size: { width, height } } : {}),
        minimumTool,
        maximumTool,
        ...(optionalOutputs ? optionalOutputs : {}),
    };
}

export { createItem, createRequirements, createOptionalOutput };
