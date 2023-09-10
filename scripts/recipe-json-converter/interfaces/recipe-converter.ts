import {
    CraftableRecipeConverter,
    CraftableRecipeConverterInputs,
} from "./craftable-recipe-converter";
import { JSONWriter } from "./json-writer";
import {
    MineableItemConverter,
    MineableItemConverterInputs,
} from "./mineable-item-converter";

type RecipeConverterDependencies = {
    convertCraftableRecipes: (
        input: CraftableRecipeConverterInputs
    ) => ReturnType<CraftableRecipeConverter>;
    convertMineableItems: (
        input: MineableItemConverterInputs
    ) => ReturnType<MineableItemConverter>;
    writeJSON: JSONWriter;
};

type RecipeConverterInputs = CraftableRecipeConverterInputs & {
    outputFilePath: string;
};

type RecipeConverterParameters = RecipeConverterInputs &
    RecipeConverterDependencies;

interface RecipeConverter {
    (params: RecipeConverterParameters): Promise<boolean>;
}

export {
    RecipeConverter,
    RecipeConverterDependencies,
    RecipeConverterInputs,
    RecipeConverterParameters,
};
