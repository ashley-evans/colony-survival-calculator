import { BlockBehaviours, Recipes, PiplizToolsets } from "../types";
import { FileFinder } from "./file-finder";
import { JSONFileReader } from "./json-file-reader";
import { JSONWriter } from "./json-writer";

type RecipeConverterDependencies = {
    findFiles: FileFinder;
    readToolsFile: JSONFileReader<PiplizToolsets>;
    readRecipeFile: JSONFileReader<Recipes>;
    readBehavioursFile: JSONFileReader<BlockBehaviours>;
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
