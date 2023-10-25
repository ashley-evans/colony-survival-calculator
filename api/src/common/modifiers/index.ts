import { Tools as GraphQLSchemaTools } from "../../graphql/schema";
import { DefaultToolset } from "../../types";

const ToolModifierValues: Readonly<Record<DefaultToolset, number>> = {
    [DefaultToolset.none]: 1,
    [DefaultToolset.stone]: 2,
    [DefaultToolset.copper]: 4,
    [DefaultToolset.iron]: 5.3,
    [DefaultToolset.bronze]: 6.15,
    [DefaultToolset.steel]: 8,
};

const ToolSchemaMap: Record<GraphQLSchemaTools, DefaultToolset> = {
    NONE: DefaultToolset.none,
    STONE: DefaultToolset.stone,
    COPPER: DefaultToolset.copper,
    IRON: DefaultToolset.iron,
    BRONZE: DefaultToolset.bronze,
    STEEL: DefaultToolset.steel,
};

const GraphQLToolsSchemaMap: Record<DefaultToolset, GraphQLSchemaTools> = {
    [DefaultToolset.none]: "NONE",
    [DefaultToolset.stone]: "STONE",
    [DefaultToolset.copper]: "COPPER",
    [DefaultToolset.iron]: "IRON",
    [DefaultToolset.bronze]: "BRONZE",
    [DefaultToolset.steel]: "STEEL",
};

function isAvailableToolSufficient(
    minimum: DefaultToolset,
    available: DefaultToolset
): boolean {
    const minimumToolModifier = ToolModifierValues[minimum];
    const availableToolModifier = ToolModifierValues[available];
    return availableToolModifier >= minimumToolModifier;
}

function getMaxToolModifier(
    maximum: DefaultToolset,
    available: DefaultToolset
): number {
    const maximumToolModifier = ToolModifierValues[maximum];
    const availableToolModifier = ToolModifierValues[available];
    return availableToolModifier > maximumToolModifier
        ? maximumToolModifier
        : availableToolModifier;
}

export {
    ToolSchemaMap,
    GraphQLToolsSchemaMap,
    ToolModifierValues,
    isAvailableToolSufficient,
    getMaxToolModifier,
};
