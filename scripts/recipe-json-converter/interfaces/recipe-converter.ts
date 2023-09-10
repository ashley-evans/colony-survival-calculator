import {
    CraftableRecipeConverter,
    CraftableRecipeConverterInputs,
} from "./craftable-recipe-converter";
import { JSONWriter } from "./json-writer";

type RecipeConverterDependencies = {
    convertCraftableRecipes: (
        input: CraftableRecipeConverterInputs
    ) => ReturnType<CraftableRecipeConverter>;
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
