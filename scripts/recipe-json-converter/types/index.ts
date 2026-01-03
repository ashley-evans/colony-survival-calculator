export * from "./__generated__/block-behaviours";
export * from "./__generated__/mineable-items";
export * from "./__generated__/growables";
export * from "./__generated__/localisation";
import { Recipes } from "./__generated__/recipes";
import {
    Tools as PiplizTools,
    Toolsets as PiplizToolsets,
} from "./__generated__/tools";
import {
    Item,
    Items,
    Requirement,
    Requirements,
    OptionalOutput,
    DefaultToolset,
    MachineToolset,
} from "./__generated__/items";

type APITools = DefaultToolset | MachineToolset;

type NPCToolsetMapping = {
    npcType: string;
    toolset: string;
};

type Recipe = Recipes[number];
type RecipeResult = Recipe["results"][number];

export { PiplizTools, DefaultToolset, MachineToolset };
export type {
    NPCToolsetMapping,
    Item,
    Items,
    Requirement,
    Requirements,
    OptionalOutput,
    PiplizToolsets,
    APITools,
    Recipes,
    Recipe,
    RecipeResult,
};
