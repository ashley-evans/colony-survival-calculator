export * from "./generated/block-behaviours";
export * from "./generated/mineable-items";
export * from "./generated/growables";
import { Recipes } from "./generated/recipes";
import {
    Tools as PiplizTools,
    Toolsets as PiplizToolsets,
} from "./generated/tools";
import {
    Item,
    Items,
    Requirement,
    Requirements,
    OptionalOutput,
    DefaultToolset,
    MachineToolset,
} from "./generated/items";

type APITools = DefaultToolset | MachineToolset;

type NPCToolsetMapping = {
    npcType: string;
    toolset: string;
};

type Recipe = Recipes[number];
type RecipeResult = Recipe["results"][number];

export {
    NPCToolsetMapping,
    Item,
    Items,
    Requirement,
    Requirements,
    OptionalOutput,
    PiplizTools,
    PiplizToolsets,
    APITools,
    DefaultToolset,
    MachineToolset,
    Recipes,
    Recipe,
    RecipeResult,
};
