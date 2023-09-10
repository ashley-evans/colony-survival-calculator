import { RecipeConverter } from "../interfaces/recipe-converter";
import { Item, Items } from "../types";

const createRecipeMap = (
    items: Readonly<Items>
): Map<string, Map<string, Item>> => {
    const knownRecipes = new Map<string, Map<string, Item>>();
    for (const item of items) {
        const recipes = knownRecipes.get(item.name) ?? new Map<string, Item>();
        recipes.set(item.creator, item);
        knownRecipes.set(item.name, recipes);
    }

    return knownRecipes;
};

const filterUncreatableItems = (items: Readonly<Items>): Items => {
    const map = createRecipeMap(items);
    const creatableItems = new Map<string, Item>();
    const getCreatableMapKey = (item: Item) => JSON.stringify(item);

    const isCreatable = (item: Item) =>
        item.requires.every(
            (requirement) => map.get(requirement.name)?.size ?? 0 > 0
        );

    const deleteRecipe = (item: Item) => {
        const recipes = map.get(item.name) as Map<string, Item>;
        recipes.delete(item.creator);
    };

    const logRemoval = (item: Item) =>
        console.log(
            `Removed recipe: ${item.name} from ${item.creator} as depends on item that cannot be created`
        );

    for (const item of items) {
        if (isCreatable(item)) {
            creatableItems.set(getCreatableMapKey(item), item);
            continue;
        }

        deleteRecipe(item);
        logRemoval(item);
        for (const creatable of creatableItems.values()) {
            if (!isCreatable(creatable)) {
                creatableItems.delete(getCreatableMapKey(creatable));
                deleteRecipe(creatable);
                logRemoval(creatable);
            }
        }
    }

    return Array.from(creatableItems.values());
};

const convertRecipes: RecipeConverter = async ({
    inputDirectoryPath,
    outputFilePath,
    convertCraftableRecipes,
    convertMineableItems,
    convertGrowables,
    writeJSON,
}) => {
    const craftable = await convertCraftableRecipes({ inputDirectoryPath });
    const mineable = await convertMineableItems({ inputDirectoryPath });
    const growables = await convertGrowables({ inputDirectoryPath });
    const combined = craftable.concat(mineable, growables);
    const filtered = filterUncreatableItems(combined);
    if (filtered.length === 0) {
        return false;
    }

    return writeJSON(outputFilePath, filtered);
};

export { convertRecipes };
