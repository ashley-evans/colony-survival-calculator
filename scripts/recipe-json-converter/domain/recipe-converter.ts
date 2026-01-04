import { LocalisationConverterOutput } from "../interfaces/localisation-converter";
import { RecipeConverter } from "../interfaces/recipe-converter";
import { Items, UntranslatedItem } from "../types";

const createRecipeMap = (
    items: Readonly<UntranslatedItem[]>,
): Map<string, Map<string, UntranslatedItem>> => {
    const knownRecipes = new Map<string, Map<string, UntranslatedItem>>();
    for (const item of items) {
        const recipes =
            knownRecipes.get(item.id) ?? new Map<string, UntranslatedItem>();
        recipes.set(item.creatorID, item);
        knownRecipes.set(item.id, recipes);
    }

    return knownRecipes;
};

const filterUncreatableItems = (
    items: Readonly<UntranslatedItem[]>,
): UntranslatedItem[] => {
    const map = createRecipeMap(items);
    const creatableItems = new Map<string, UntranslatedItem>();
    const getCreatableMapKey = (item: UntranslatedItem) => JSON.stringify(item);

    const isCreatable = (item: UntranslatedItem) =>
        item.requires.every(
            (requirement) => map.get(requirement.id)?.size ?? 0 > 0,
        );

    const deleteRecipe = (item: UntranslatedItem) => {
        const recipes = map.get(item.id) as Map<string, UntranslatedItem>;
        recipes.delete(item.creatorID);
    };

    const logRemoval = (item: UntranslatedItem) =>
        console.log(
            `Removed recipe: ${item.id} from ${item.creatorID} as depends on item that cannot be created`,
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

const attachLocalisationData = (
    untranslated: UntranslatedItem[],
    localisationOutput: LocalisationConverterOutput,
): Items => {
    const missingLocales = new Set<string>();
    const { data: localisationData, locales } = localisationOutput;

    return untranslated.map((item) => {
        const itemLocalisationData = localisationData.items[item.id];
        const creatorLocalisationData =
            localisationData.creators[item.creatorID];

        if (!itemLocalisationData) {
            throw new Error(`Missing localisation data for item: ${item.id}`);
        }

        if (!creatorLocalisationData) {
            throw new Error(
                `Missing localisation data for creator: ${item.creatorID}`,
            );
        }

        const filteredItemLocales: { [key: string]: string } = {};
        const filteredCreatorLocales: { [key: string]: string } = {};

        for (const locale of locales) {
            if (missingLocales.has(locale)) {
                continue;
            }

            if (
                !itemLocalisationData[locale] ||
                !creatorLocalisationData[locale]
            ) {
                missingLocales.add(locale);
                continue;
            }

            filteredItemLocales[locale] = itemLocalisationData[locale];
            filteredCreatorLocales[locale] = creatorLocalisationData[locale];
        }

        return {
            ...item,
            i18n: {
                name: filteredItemLocales,
                creator: filteredCreatorLocales,
            },
        };
    });
};

const convertRecipes: RecipeConverter = async ({
    inputDirectoryPath,
    outputFilePath,
    convertCraftableRecipes,
    convertMineableItems,
    convertGrowables,
    convertLocalisation,
    writeJSON,
}) => {
    const craftable = await convertCraftableRecipes({ inputDirectoryPath });
    const mineable = await convertMineableItems({ inputDirectoryPath });
    const growables = await convertGrowables({ inputDirectoryPath });
    const flattendLocalisationData = await convertLocalisation({
        inputDirectoryPath,
    });
    const combined = craftable.concat(mineable, growables);
    const filtered = filterUncreatableItems(combined);
    if (filtered.length === 0) {
        return false;
    }

    if (flattendLocalisationData.locales.size === 0) {
        throw new Error("No localisation data available");
    }

    const items = attachLocalisationData(filtered, flattendLocalisationData);

    return writeJSON(outputFilePath, items);
};

export { convertRecipes };
