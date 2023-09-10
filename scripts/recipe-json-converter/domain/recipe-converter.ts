import { RecipeConverter } from "../interfaces/recipe-converter";

const convertRecipes: RecipeConverter = async ({
    inputDirectoryPath,
    outputFilePath,
    convertCraftableRecipes,
    writeJSON,
}) => {
    const craftable = await convertCraftableRecipes({ inputDirectoryPath });
    if (craftable.length === 0) {
        return false;
    }

    return writeJSON(outputFilePath, craftable);
};

export { convertRecipes };
