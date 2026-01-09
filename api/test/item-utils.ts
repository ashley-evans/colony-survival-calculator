import {
    DefaultToolset,
    Item,
    MachineToolset,
    OptionalOutput,
    Requirement,
    Requirements,
    Toolset,
    TranslatedItem,
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

type TranslatedItemFactoryInputs = Omit<ItemFactoryInputs, "i18n" | "id"> & {
    name: string;
    id?: string;
    creator?: string;
};

function baseCreateTranslatedItem({
    name,
    creator,
    ...rest
}: TranslatedItemFactoryInputs): TranslatedItem {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { i18n, ...item } = baseCreateItem({
        ...rest,
        id: rest.id ?? `${name.toLocaleLowerCase().replace(" ", "")}`,
        i18n: { name: {}, creator: {} },
    });

    return {
        ...item,
        name: name,
        creator: creator ?? `${name} Creator`,
    };
}

type CreateTranslatedItemParams =
    | { item: Item; locale: string }
    | (Omit<TranslatedItemFactoryInputs, "toolset"> & {
          minimumTool?: DefaultToolset;
          maximumTool?: DefaultToolset;
      });

function createTranslatedItem(
    params: CreateTranslatedItemParams,
): TranslatedItem {
    if (!("locale" in params)) {
        return baseCreateTranslatedItem({
            ...params,
            toolset: {
                type: "default",
                minimumTool: params.minimumTool ?? ("none" as DefaultToolset),
                maximumTool: params.maximumTool ?? ("none" as DefaultToolset),
            },
        });
    }

    const { i18n, ...rest } = params.item;
    const name = i18n.name[params.locale];
    const creator = i18n.creator[params.locale];
    if (!name || !creator) {
        throw new Error(
            `Missing translation for locale: ${params.locale} in item: ${params.item.id}`,
        );
    }

    return {
        ...rest,
        name,
        creator,
    };
}

function createTranslatedItemWithMachineTools(
    params: Omit<TranslatedItemFactoryInputs, "toolset">,
): TranslatedItem {
    return baseCreateTranslatedItem({
        ...params,
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
    createTranslatedItem,
    createTranslatedItemWithMachineTools,
};
