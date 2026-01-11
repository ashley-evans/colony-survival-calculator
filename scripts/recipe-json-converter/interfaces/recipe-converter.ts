import {
    CraftableRecipeConverter,
    CraftableRecipeConverterInputs,
} from "./craftable-recipe-converter";
import {
    GrowableConverter,
    GrowableConverterInputs,
} from "./growable-converter";
import { JSONWriter } from "./json-writer";
import {
    LocalisationConverter,
    LocalisationConverterInputs,
} from "./localisation-converter";
import {
    MineableItemConverter,
    MineableItemConverterInputs,
} from "./mineable-item-converter";

type RecipeConverterDependencies = {
    convertCraftableRecipes: (
        input: CraftableRecipeConverterInputs,
    ) => ReturnType<CraftableRecipeConverter>;
    convertMineableItems: (
        input: MineableItemConverterInputs,
    ) => ReturnType<MineableItemConverter>;
    convertGrowables: (
        input: GrowableConverterInputs,
    ) => ReturnType<GrowableConverter>;
    convertLocalisation: (
        input: LocalisationConverterInputs,
    ) => ReturnType<LocalisationConverter>;
    writeJSON: JSONWriter;
};

type RecipeConverterInputs = {
    inputDirectoryPath: string;
    outputFilePath: string;
};

type RecipeConverterParameters = RecipeConverterInputs &
    RecipeConverterDependencies;

interface RecipeConverter {
    (params: RecipeConverterParameters): Promise<boolean>;
}

export type {
    RecipeConverter,
    RecipeConverterDependencies,
    RecipeConverterInputs,
    RecipeConverterParameters,
};
