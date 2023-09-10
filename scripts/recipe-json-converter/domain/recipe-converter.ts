import { RecipeConverter } from "../interfaces/recipe-converter";

const convertRecipes: RecipeConverter = async ({
    inputDirectoryPath,
    outputFilePath,
    convertCraftableRecipes,
    convertMineableItems,
    writeJSON,
}) => {
    const craftable = await convertCraftableRecipes({ inputDirectoryPath });
    const mineable = await convertMineableItems({ inputDirectoryPath });
    const combined = craftable.concat(mineable);
    if (combined.length === 0) {
        return false;
    }

    return writeJSON(outputFilePath, combined);
};

export { convertRecipes };
