import {
    AvailableTools,
    Tools as GraphQLSchemaTools,
} from "../../graphql/schema";
import { AllToolsets, DefaultToolset } from "../../types";

const ToolModifierValues: Readonly<Record<AllToolsets, number>> = {
    none: 1,
    stone: 2,
    copper: 4,
    iron: 5.3,
    bronze: 6.15,
    steel: 8,
    machine: 1,
};

const AvailableToolsSchemaMap: Record<AvailableTools, DefaultToolset> = {
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
