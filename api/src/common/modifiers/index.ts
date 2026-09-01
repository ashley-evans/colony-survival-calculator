import {
    AvailableDefaultTools as GraphQLAvailableDefaultTools,
    AvailableTools as GraphQLAvailableTools,
    Tools as GraphQLSchemaTools,
} from "../../graphql/schema";
import {
    AllToolsets,
    AvailableTools,
    AvailableToolsInput,
    DefaultToolset,
    EyeglassesToolset,
    TranslatedItem,
} from "../../types";

const ToolModifierValues: Readonly<Record<AllToolsets, number>> = {
    none: 1,
    stone: 2,
    copper: 4,
    iron: 5.3,
    bronze: 6.15,
    steel: 8,
    machine: 1,
    noglasses: 1,
    eyeglasses: 1.2,
};

const AvailableToolsSchemaMap: Record<
    GraphQLAvailableDefaultTools,
    DefaultToolset
> = {
    NONE: "none" as DefaultToolset,
    STONE: "stone" as DefaultToolset,
    COPPER: "copper" as DefaultToolset,
    IRON: "iron" as DefaultToolset,
    BRONZE: "bronze" as DefaultToolset,
    STEEL: "steel" as DefaultToolset,
};

const GraphQLToolsSchemaMap: Record<AllToolsets, GraphQLSchemaTools> = {
    none: "NONE",
    stone: "STONE",
    copper: "COPPER",
    iron: "IRON",
    bronze: "BRONZE",
    steel: "STEEL",
    machine: "MACHINE",
    noglasses: "NOGLASSES",
    eyeglasses: "EYEGLASSES",
};

function getToolModifier(maximum: AllToolsets, available: AllToolsets): number {
    const maximumToolModifier = ToolModifierValues[maximum];
    const availableToolModifier = ToolModifierValues[available];
    return availableToolModifier > maximumToolModifier
        ? maximumToolModifier
        : availableToolModifier;
}

function getMaxToolModifier(
    item: Pick<TranslatedItem, "toolset">,
    available: AvailableTools,
): number {
    if (item.toolset.type === "machine") {
        return ToolModifierValues["machine"];
    }

    if (item.toolset.type === "eyeglasses") {
        const availableEyeglassesToolset = available.eyeglasses
            ? ("eyeglasses" as EyeglassesToolset)
            : ("noglasses" as EyeglassesToolset);

        return getToolModifier(
            item.toolset.maximumTool,
            availableEyeglassesToolset,
        );
    }

    return getToolModifier(item.toolset.maximumTool, available.default);
}

function mapAvailableTools(input: GraphQLAvailableTools): AvailableToolsInput {
    return {
        ...(input.default
            ? { default: AvailableToolsSchemaMap[input.default] }
            : {}),
        ...(input.machine !== null && input.machine !== undefined
            ? { machine: input.machine }
            : {}),
        ...(input.eyeglasses !== null && input.eyeglasses !== undefined
            ? { eyeglasses: input.eyeglasses }
            : {}),
    };
}

function resolveAvailableTools(
    provided: AvailableToolsInput | undefined,
    defaults: AvailableTools,
): AvailableTools {
    return {
        default: provided?.default ?? defaults.default,
        machine: provided?.machine ?? defaults.machine,
        eyeglasses: provided?.eyeglasses ?? defaults.eyeglasses,
    };
}

export {
    AvailableToolsSchemaMap,
    GraphQLToolsSchemaMap,
    ToolModifierValues,
    getMaxToolModifier,
    mapAvailableTools,
    resolveAvailableTools,
};
