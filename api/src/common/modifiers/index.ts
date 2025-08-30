import {
    AvailableTools,
    Tools as GraphQLSchemaTools,
} from "../../graphql/schema";
import { AllToolsets, DefaultToolset, MachineToolset } from "../../types";

const ToolModifierValues: Readonly<Record<AllToolsets, number>> = {
    [DefaultToolset.none]: 1,
    [DefaultToolset.stone]: 2,
    [DefaultToolset.copper]: 4,
    [DefaultToolset.iron]: 5.3,
    [DefaultToolset.bronze]: 6.15,
    [DefaultToolset.steel]: 8,
    [MachineToolset.machine]: 1,
};

const AvailableToolsSchemaMap: Record<AvailableTools, DefaultToolset> = {
    NONE: DefaultToolset.none,
    STONE: DefaultToolset.stone,
    COPPER: DefaultToolset.copper,
    IRON: DefaultToolset.iron,
    BRONZE: DefaultToolset.bronze,
    STEEL: DefaultToolset.steel,
};

const GraphQLToolsSchemaMap: Record<AllToolsets, GraphQLSchemaTools> = {
    [DefaultToolset.none]: "NONE",
    [DefaultToolset.stone]: "STONE",
    [DefaultToolset.copper]: "COPPER",
    [DefaultToolset.iron]: "IRON",
    [DefaultToolset.bronze]: "BRONZE",
    [DefaultToolset.steel]: "STEEL",
    [MachineToolset.machine]: "MACHINE",
};

function getMaxToolModifier(
    maximum: DefaultToolset,
    available: DefaultToolset,
): number {
    const maximumToolModifier = ToolModifierValues[maximum];
    const availableToolModifier = ToolModifierValues[available];
    return availableToolModifier > maximumToolModifier
        ? maximumToolModifier
        : availableToolModifier;
}

export {
    AvailableToolsSchemaMap,
    GraphQLToolsSchemaMap,
    ToolModifierValues,
    getMaxToolModifier,
};
