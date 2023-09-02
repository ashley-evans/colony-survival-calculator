import { FileFinder } from "../interfaces/file-finder";
import { JSONFileReader } from "../interfaces/json-file-reader";
import { RecipeConverter } from "../interfaces/recipe-converter";
import { BlockBehaviours, Recipes, Toolsets } from "../types";

const JSON_FILE_EXTENSION = ".json";
const TOOLSETS_FILE_NAME = "toolsets";
const BLOCK_BEHAVIOURS_FILE_NAME = "generateblocks";
const RECIPE_PREFIX = "recipes_";
const RECIPE_EXCLUSION_SET = new Set<string>(["recipes_merchant.json"]);

const getKnownToolsets = async (
    inputDirectoryPath: string,
    findFiles: FileFinder,
    readToolsFile: JSONFileReader<Toolsets>
): Promise<Toolsets> => {
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
): Promise<Recipes[]> => {
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

    return Promise.all(filtered.map((path) => readRecipeFile(path)));
};

const convertRecipes: RecipeConverter = async ({
    inputDirectoryPath,
    findFiles,
    readToolsFile,
    readBehavioursFile,
    readRecipeFile,
}) => {
    await getKnownToolsets(inputDirectoryPath, findFiles, readToolsFile);
    await getBlockBehaviours(inputDirectoryPath, findFiles, readBehavioursFile);
    await getKnownRecipes(inputDirectoryPath, findFiles, readRecipeFile);

    return true;
};

export { convertRecipes };
