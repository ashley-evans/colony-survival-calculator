import { Tools as GraphQLSchemaTools } from "../../graphql/schema";
import { Tools as JSONSchemaTools } from "../../types";

const ToolModifierValues: Readonly<Record<JSONSchemaTools, number>> = {
    [JSONSchemaTools.none]: 1,
    [JSONSchemaTools.stone]: 2,
    [JSONSchemaTools.copper]: 4,
    [JSONSchemaTools.iron]: 5.3,
    [JSONSchemaTools.bronze]: 6.15,
    [JSONSchemaTools.steel]: 8,
};

const ToolSchemaMap: Record<GraphQLSchemaTools, JSONSchemaTools> = {
    NONE: JSONSchemaTools.none,
    STONE: JSONSchemaTools.stone,
    COPPER: JSONSchemaTools.copper,
    IRON: JSONSchemaTools.iron,
    BRONZE: JSONSchemaTools.bronze,
    STEEL: JSONSchemaTools.steel,
};

function isAvailableToolSufficient(
    minimum: JSONSchemaTools,
    available: JSONSchemaTools
): boolean {
    const minimumToolModifier = ToolModifierValues[minimum];
    const availableToolModifier = ToolModifierValues[available];
    return availableToolModifier >= minimumToolModifier;
}

function getMaxToolModifier(
    maximum: JSONSchemaTools,
    available: JSONSchemaTools
): number {
    const maximumToolModifier = ToolModifierValues[maximum];
    const availableToolModifier = ToolModifierValues[available];
    return availableToolModifier > maximumToolModifier
        ? maximumToolModifier
        : availableToolModifier;
}

export {
    ToolSchemaMap,
    ToolModifierValues,
    isAvailableToolSufficient,
    getMaxToolModifier,
};
