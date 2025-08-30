import {
    DefaultToolset,
    Item,
    MachineToolset,
    OptionalOutput,
    Requirement,
    Requirements,
    Toolset,
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

type ItemFactoryInputs = {
    name: string;
    createTime: number;
    output: number;
    requirements: Requirements;
    toolset: Toolset;
    creator?: string;
    optionalOutputs?: OptionalOutput[];
    width?: number;
    height?: number;
};

function baseCreateItem({
    name,
    createTime,
    output,
    requirements,
    toolset,
    creator = `${name} creator`,
    optionalOutputs,
    width,
    height,
}: ItemFactoryInputs): Item {
    return {
        name,
        createTime,
        output,
        creator,
        requires: requirements,
        ...(width && height ? { size: { width, height } } : {}),
        toolset,
        ...(optionalOutputs ? { optionalOutputs } : {}),
    };
}

function createItem(
    input: Omit<ItemFactoryInputs, "toolset"> & {
        minimumTool?: DefaultToolset;
        maximumTool?: DefaultToolset;
    },
): Item {
    const { minimumTool, maximumTool, ...rest } = input;
    return baseCreateItem({
        ...rest,
        toolset: {
            type: "default",
            minimumTool: minimumTool ?? DefaultToolset.none,
            maximumTool: maximumTool ?? DefaultToolset.none,
        },
    });
}

function createItemWithMachineTools(
    input: Omit<ItemFactoryInputs, "toolset">,
): Item {
    return baseCreateItem({
        ...input,
        toolset: {
            type: "machine",
            minimumTool: MachineToolset.machine,
            maximumTool: MachineToolset.machine,
        },
    });
}

export {
    createItem,
    createItemWithMachineTools,
    createRequirements,
    createOptionalOutput,
};
