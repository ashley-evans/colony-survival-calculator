import {
    DefaultToolset,
    Item,
    MachineToolset,
    OptionalOutput,
    Requirement,
    Requirements,
    Toolset,
} from "../src/types";

function createRequirements(id: string, amount: number): Requirement {
    return {
        id,
        amount,
    };
}

function createOptionalOutput({
    id,
    amount,
    likelihood,
}: {
    id: string;
    amount: number;
    likelihood: number;
}): OptionalOutput {
    return {
        id,
        amount,
        likelihood,
    };
}

type ItemFactoryInputs = {
    id: string;
    createTime: number;
    output: number;
    requirements: Requirements;
    toolset: Toolset;
    creatorID?: string;
    optionalOutputs?: OptionalOutput[];
    width?: number;
    height?: number;
    i18n?: Item["i18n"];
};

function baseCreateItem({
    id,
    createTime,
    output,
    requirements,
    toolset,
    creatorID = `${id}creator`,
    optionalOutputs,
    width,
    height,
    i18n,
}: ItemFactoryInputs): Item {
    return {
        id,
        createTime,
        output,
        creatorID,
        requires: requirements,
        ...(width && height ? { size: { width, height } } : {}),
        toolset,
        ...(optionalOutputs ? { optionalOutputs } : {}),
        ...(i18n
            ? { i18n }
            : {
                  i18n: {
                      name: { "en-US": id },
                      creator: { "en-US": creatorID },
                  },
              }),
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
            minimumTool: minimumTool ?? ("none" as DefaultToolset),
            maximumTool: maximumTool ?? ("none" as DefaultToolset),
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
            minimumTool: "machine" as MachineToolset,
            maximumTool: "machine" as MachineToolset,
        },
    });
}

export {
    createItem,
    createItemWithMachineTools,
    createRequirements,
    createOptionalOutput,
};
