import { BlockBehaviours, Recipes, Toolsets } from "../types";
import { FileFinder } from "./file-finder";
import { JSONFileReader } from "./json-file-reader";

type RecipeConverterDependencies = {
    findFiles: FileFinder;
    readToolsFile: JSONFileReader<Toolsets>;
    readRecipeFile: JSONFileReader<Recipes>;
    readBehavioursFile: JSONFileReader<BlockBehaviours>;
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
