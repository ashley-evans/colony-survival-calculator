#!/usr/bin/env tsx

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import toolsSchema from "./schemas/tools.json";
import recipesSchema from "./schemas/recipes.json";
import behavioursSchema from "./schemas/block-behaviours.json";
import mineableItemsSchema from "./schemas/mineable-items.json";
import growablesSchema from "./schemas/growables.json";
import localisationSchema from "./schemas/localisation.json";
import { JSONFileReader } from "./interfaces/json-file-reader";
import {
    BlockBehaviours,
    Recipes,
    PiplizToolsets,
    MineableItems,
    Growables,
    Localisation,
} from "./types";
import { factory as createJSONFileAdapter } from "./adapters/json-file-adapter";
import { convertRecipes as baseConvertCraftableRecipes } from "./domain/craftable-recipe-converter";
import { convertRecipes as baseConvertRecipes } from "./domain/recipe-converter";
import { convertMineableItems as baseConvertMineableItems } from "./domain/mineable-item-converter";
import { convertGrowables as baseConvertGrowables } from "./domain/growable-converter";
import { convertLocalisationFiles as baseConvertLocalisationFiles } from "./domain/localisation-converter";
import { findFiles } from "./adapters/fs-file-adapter";
import { writeJSONToFile } from "./adapters/json-file-writer";
import {
    CraftableRecipeConverter,
    CraftableRecipeConverterInputs,
} from "./interfaces/craftable-recipe-converter";
import {
    RecipeConverter,
    RecipeConverterInputs,
} from "./interfaces/recipe-converter";
import {
    MineableItemConverter,
    MineableItemConverterInputs,
} from "./interfaces/mineable-item-converter";
import {
    GrowableConverter,
    GrowableConverterInputs,
} from "./interfaces/growable-converter";
import {
    LocalisationConverter,
    LocalisationConverterInputs,
} from "./interfaces/localisation-converter";

const parser = yargs(hideBin(process.argv)).options({
    inputDirectory: {
        alias: "i",
        type: "string",
        demandOption: true,
        requiresArg: true,
        describe: "Path to directory containing all raw colony survival files",
    },
    outputFile: {
        alias: "o",
        type: "string",
        demandOption: true,
        requiresArg: true,
        describe: "Path to write output to",
    },
});

const createToolsFileReader = (): JSONFileReader<PiplizToolsets> => {
    return createJSONFileAdapter(toolsSchema);
};

const createBehavioursFileReader = (): JSONFileReader<BlockBehaviours> => {
    return createJSONFileAdapter(behavioursSchema);
};

const createRecipesFileReader = (): JSONFileReader<Recipes> => {
    return createJSONFileAdapter(recipesSchema);
};

const createLocalisationFileReader = (): JSONFileReader<Localisation> => {
    return createJSONFileAdapter(localisationSchema);
};

const createCraftableRecipeConverter = (): ((
    input: CraftableRecipeConverterInputs,
) => ReturnType<CraftableRecipeConverter>) => {
    const toolsReader = createToolsFileReader();
    const behavioursReader = createBehavioursFileReader();
    const recipesReader = createRecipesFileReader();

    return (input) =>
        baseConvertCraftableRecipes({
            ...input,
            findFiles,
            readToolsFile: toolsReader,
            readBehavioursFile: behavioursReader,
            readRecipeFile: recipesReader,
        });
};

const createMineableItemsFileReader = (): JSONFileReader<MineableItems> => {
    return createJSONFileAdapter(mineableItemsSchema);
};

const createMineableItemsConverter = (): ((
    input: MineableItemConverterInputs,
) => ReturnType<MineableItemConverter>) => {
    const mineableItemsReader = createMineableItemsFileReader();

    return (input) =>
        baseConvertMineableItems({
            ...input,
            findFiles,
            readMineableItemsFile: mineableItemsReader,
        });
};

const createGrowableItemsFileReader = (): JSONFileReader<Growables> => {
    return createJSONFileAdapter(growablesSchema);
};

const createGrowablesConverter = (): ((
    input: GrowableConverterInputs,
) => ReturnType<GrowableConverter>) => {
    const growablesReader = createGrowableItemsFileReader();

    return (input) =>
        baseConvertGrowables({
            ...input,
            findFiles,
            readGrowablesFile: growablesReader,
        });
};

const createLocalisationConverter = (): ((
    input: LocalisationConverterInputs,
) => ReturnType<LocalisationConverter>) => {
    const localisationReader = createLocalisationFileReader();

    return (input) =>
        baseConvertLocalisationFiles({
            ...input,
            findFiles,
            readLocalisationFile: localisationReader,
        });
};

const createRecipeConverter = (): ((
    input: RecipeConverterInputs,
) => ReturnType<RecipeConverter>) => {
    const convertCraftableRecipes = createCraftableRecipeConverter();
    const convertMineableItems = createMineableItemsConverter();
    const convertGrowables = createGrowablesConverter();
    const convertLocalisation = createLocalisationConverter();

    return (input) =>
        baseConvertRecipes({
            ...input,
            convertCraftableRecipes,
            convertMineableItems,
            convertGrowables,
            convertLocalisation,
            writeJSON: writeJSONToFile,
        });
};

(async () => {
    const argv = await parser.argv;
    const convertRecipes = createRecipeConverter();

    try {
        const result = await convertRecipes({
            inputDirectoryPath: argv.inputDirectory,
            outputFilePath: argv.outputFile,
        });

        process.exit(result ? 0 : 1);
    } catch (ex) {
        console.error(ex);
        process.exit(1);
    }
})();
