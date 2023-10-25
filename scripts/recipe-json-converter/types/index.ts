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
    DefaultToolset as APITools,
} from "./generated/items";

type NPCToolsetMapping = {
    npcType: string;
    toolset: string;
};

type RecipeResult = Recipes[number]["results"][number];

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
    Recipes,
    RecipeResult,
};
