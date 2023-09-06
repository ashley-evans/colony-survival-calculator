export * from "./generated/block-behaviours";
import { Recipes } from "./generated/recipes";
import {
    Tools as PiplizTools,
    Toolsets as PiplizToolsets,
} from "./generated/tools";
import { Item, Tools as APITools } from "./generated/items";

type NPCToolsetMapping = {
    npcType: string;
    toolset: string;
};

type RecipeResult = Recipes[number]["results"][number];

export {
    NPCToolsetMapping,
    Item,
    PiplizTools,
    PiplizToolsets,
    APITools,
    Recipes,
    RecipeResult,
};
