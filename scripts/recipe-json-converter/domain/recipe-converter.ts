import { FileFinder } from "../interfaces/file-finder";
import { JSONFileReader } from "../interfaces/json-file-reader";
import { RecipeConverter } from "../interfaces/recipe-converter";
import {
    BlockBehaviours,
    Item,
    NPCToolsetMapping,
    Recipes,
    PiplizTools,
    PiplizToolsets,
    RecipeResult,
} from "../types";
import {
    UNSUPPORTED_TOOL_ERROR,
    getDefaultMinMaxTools,
    getMinMaxTools,
} from "./tool-utils";
import {
    getUserFriendlyCreatorName,
    getUserFriendlyItemName,
} from "./recipe-dictionary";
import {
    filterByCondition,
    splitPiplizCreator,
    splitPiplizName,
} from "./utils";
import { Items, OptionalOutput, Requirements } from "../types/generated/items";

const JSON_FILE_EXTENSION = ".json";
const TOOLSETS_FILE_NAME = "toolsets";
const BLOCK_BEHAVIOURS_FILE_NAME = "generateblocks";
const RECIPE_PREFIX = "recipes_";
const RECIPE_EXCLUSION_SET = new Set<string>(["recipes_merchant.json"]);

type PiplizToolset = PiplizToolsets[number];
type Recipe = Recipes[number];

const getKnownToolsets = async (
    inputDirectoryPath: string,
    findFiles: FileFinder,
    readToolsFile: JSONFileReader<PiplizToolsets>
): Promise<PiplizToolsets> => {
    const toolsetFiles = await findFiles({
        root: inputDirectoryPath,
        fileExtension: JSON_FILE_EXTENSION,
        exact: TOOLSETS_FILE_NAME,
    });

    if (toolsetFiles.length === 0) {
        throw new Error(
            `No ${TOOLSETS_FILE_NAME}${JSON_FILE_EXTENSION} file found in provided directory`
        );
    } else if (toolsetFiles.length > 1) {
        throw new Error(
            `Multiple ${TOOLSETS_FILE_NAME}${JSON_FILE_EXTENSION} files found, ensure only one exists`
        );
    }

    return readToolsFile(toolsetFiles[0] as string);
};

const getBlockBehaviours = async (
    inputDirectoryPath: string,
    findFiles: FileFinder,
    readBehavioursFile: JSONFileReader<BlockBehaviours>
): Promise<BlockBehaviours> => {
    const blockBehavioursFiles = await findFiles({
        root: inputDirectoryPath,
        fileExtension: JSON_FILE_EXTENSION,
        exact: BLOCK_BEHAVIOURS_FILE_NAME,
    });

    if (blockBehavioursFiles.length === 0) {
        throw new Error(
            `No ${BLOCK_BEHAVIOURS_FILE_NAME}${JSON_FILE_EXTENSION} file found in provided directory`
        );
    } else if (blockBehavioursFiles.length > 1) {
        throw new Error(
            `Multiple ${BLOCK_BEHAVIOURS_FILE_NAME}${JSON_FILE_EXTENSION} files found, ensure only one exists`
        );
    }

    return readBehavioursFile(blockBehavioursFiles[0] as string);
};

const getKnownRecipes = async (
    inputDirectoryPath: string,
    findFiles: FileFinder,
    readRecipeFile: JSONFileReader<Recipes>
): Promise<Recipes> => {
    const recipePaths = await findFiles({
        root: inputDirectoryPath,
        fileExtension: JSON_FILE_EXTENSION,
        prefix: RECIPE_PREFIX,
    });

    const filtered = recipePaths.filter((current) => {
        const index = current.lastIndexOf("/");
        const fileName = index === -1 ? current : current.substring(index + 1);
        return !RECIPE_EXCLUSION_SET.has(fileName);
    });

    const recipes = await Promise.all(
        filtered.map((path) => readRecipeFile(path))
    );
    return recipes.flat();
};

const createToolsetMap = (
    toolsets: PiplizToolsets
): Map<string, PiplizToolset> =>
    new Map(toolsets.map((toolset) => [toolset.key, toolset]));

const createNPCToolsetMapping = (
    blockBehaviours: BlockBehaviours,
    toolsets: PiplizToolsets
): Map<string, PiplizTools[]> => {
    const toolsetMap = createToolsetMap(toolsets);
    const mappings = blockBehaviours.reduce((acc, current) => {
        if (!current.baseType?.attachBehaviour) {
            return acc;
        }

        const attachBehaviours = current.baseType.attachBehaviour.reduce(
            (acc, current) => {
                if (typeof current === "string") {
                    return acc;
                }

                if (current.npcType && current.toolset) {
                    acc.push({
                        npcType: current.npcType,
                        toolset: current.toolset,
                    });
                }

                return acc;
            },
            [] as NPCToolsetMapping[]
        );

        if (attachBehaviours[0]) {
            const { toolset: required, npcType } = attachBehaviours[0];
            const creator = splitPiplizCreator(npcType);
            const toolset = toolsetMap.get(required);
            if (!toolset) {
                throw new Error(
                    `Unknown toolset: ${required} required by ${creator}`
                );
            }

            acc.push([creator, toolset.usable]);
        }

        return acc;
    }, [] as [string, PiplizTools[]][]);

    return new Map(mappings);
};

const mapPiplizRequirementsToAPIRequirements = (
    requirements: Recipe["requires"]
): Requirements =>
    requirements.map((requirement) => {
        const convertedRequirementName = getUserFriendlyItemName(
            requirement.type
        );

        if (!convertedRequirementName) {
            throw new Error(
                `User friendly name unavailable for item: ${requirement.type}`
            );
        }

        const amount = requirement.amount ?? 1;
        return {
            name: convertedRequirementName,
            amount,
        };
    });

const mapPiplizOptionalOutputsToAPIRequirements = (
    outputs: Recipe["results"]
): OptionalOutput[] =>
    outputs.map((result) => {
        const convertedOptionalOutputName = getUserFriendlyItemName(
            result.type
        );

        if (!convertedOptionalOutputName) {
            throw new Error(
                `User friendly name unavailable for item: ${result.type}`
            );
        }

        const amount = result.amount ?? 1;
        const likelihood = "chance" in result ? result.chance : 1;
        return {
            name: convertedOptionalOutputName,
            likelihood,
            amount,
        };
    });

const mapRecipeToItem = (
    recipe: Recipe,
    npcToolsetMapping: Map<string, PiplizTools[]>
): Item => {
    const { itemName, creator } = splitPiplizName(recipe.name);
    const tools = npcToolsetMapping.get(creator);
    if (!tools) {
        console.log(
            `Defaulting to default toolset for recipe: ${itemName} from creator: ${creator}`
        );
    }

    const toolRange = getMinMaxTools(tools ?? getDefaultMinMaxTools(creator));
    const { matching, nonMatching } = filterByCondition(
        recipe.results,
        (result) => result.type === itemName
    );
    if (matching.length === 0) {
        throw new Error(
            `Unable to find primary output for recipe: ${itemName} from creator: ${creator}`
        );
    } else if (matching.length > 1) {
        throw new Error(
            `Multiple primary outputs specified for: ${itemName} from creator: ${creator}`
        );
    }

    const primaryOutputResult = matching[0] as RecipeResult;
    const output = primaryOutputResult.amount ?? 1;
    const convertedItemName = getUserFriendlyItemName(itemName);
    if (!convertedItemName) {
        throw new Error(`User friendly name unavailable for item: ${itemName}`);
    }

    const convertedCreator = getUserFriendlyCreatorName(creator);
    if (!convertedCreator) {
        throw new Error(
            `User friendly name unavailable for creator: ${creator}`
        );
    }

    const requirements = mapPiplizRequirementsToAPIRequirements(
        recipe.requires
    );
    const optionalOutputs =
        mapPiplizOptionalOutputsToAPIRequirements(nonMatching);

    return {
        name: convertedItemName,
        creator: convertedCreator,
        createTime: recipe.cooldown,
        requires: requirements,
        output,
        ...toolRange,
        ...(optionalOutputs.length > 0 ? { optionalOutputs } : {}),
    };
};

const convertRecipes: RecipeConverter = async ({
    inputDirectoryPath,
    outputFilePath,
    findFiles,
    readToolsFile,
    readBehavioursFile,
    readRecipeFile,
    writeJSON,
}) => {
    const toolsets = await getKnownToolsets(
        inputDirectoryPath,
        findFiles,
        readToolsFile
    );
    const blockBehaviours = await getBlockBehaviours(
        inputDirectoryPath,
        findFiles,
        readBehavioursFile
    );
    const npcToolsetMap = createNPCToolsetMapping(blockBehaviours, toolsets);
    const recipes = await getKnownRecipes(
        inputDirectoryPath,
        findFiles,
        readRecipeFile
    );

    const converted = recipes.reduce((acc, current) => {
        try {
            acc.push(mapRecipeToItem(current, npcToolsetMap));
        } catch (ex) {
            if (ex != UNSUPPORTED_TOOL_ERROR) {
                throw ex;
            }

            const { itemName, creator } = splitPiplizName(current.name);
            console.log(
                `Skipping recipe: ${itemName} from creator: ${creator} as requires unsupported toolset`
            );
        }

        return acc;
    }, [] as Items);

    await writeJSON(outputFilePath, converted);
    return true;
};

export { convertRecipes };
