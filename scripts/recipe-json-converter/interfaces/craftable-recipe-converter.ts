import { BlockBehaviours, Recipes, PiplizToolsets, Items } from "../types";
import { FileFinder } from "./file-finder";
import { JSONFileReader } from "./json-file-reader";

type CraftableRecipeConverterDependencies = {
    findFiles: FileFinder;
    readToolsFile: JSONFileReader<PiplizToolsets>;
    readRecipeFile: JSONFileReader<Recipes>;
    readBehavioursFile: JSONFileReader<BlockBehaviours>;
};

type CraftableRecipeConverterInputs = {
    inputDirectoryPath: string;
};

type CraftableRecipeConverterParameters = CraftableRecipeConverterInputs &
    CraftableRecipeConverterDependencies;

interface CraftableRecipeConverter {
    (params: CraftableRecipeConverterParameters): Promise<Items>;
}

export type {
    CraftableRecipeConverter,
    CraftableRecipeConverterDependencies,
    CraftableRecipeConverterInputs,
    CraftableRecipeConverterParameters,
};
