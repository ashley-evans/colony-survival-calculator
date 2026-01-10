import type {
    CreatorOverride,
    Demand,
    QueryRequirementsParams,
    QueryRequirementsPrimaryPort,
    RequirementRecipe,
} from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import { DefaultToolset, TranslatedItem } from "../../../types";
import {
    DEFAULT_LOCALE,
    hasMinimumRequiredTools,
    OutputUnit,
} from "../../../common";
import { Requirement } from "../interfaces/query-requirements-primary-port";
import {
    VertexOutput,
    computeRequirementVertices,
    createVariableName,
    isOutputVariable,
    isProductionVariable,
    isRequirementVariable,
    isTotalVariable,
} from "./requirements-linear-program";
import {
    INTERNAL_SERVER_ERROR,
    INVALID_ITEM_ID_ERROR,
    INVALID_OVERRIDE_ITEM_NOT_CREATABLE_ERROR,
    INVALID_TARGET_ERROR,
    INVALID_WORKERS_ERROR,
    MULTIPLE_OVERRIDE_ERROR_PREFIX,
    TOOL_LEVEL_ERROR_PREFIX,
    UNKNOWN_ITEM_ERROR,
} from "./errors";
import { canCreateItem, filterByCreatorOverrides } from "./item-utils";

function findMultipleOverrides(
    overrides?: CreatorOverride[],
): string | undefined {
    if (!overrides) {
        return undefined;
    }

    const knownOverrides = new Set<string>();
    for (const override of overrides) {
        if (knownOverrides.has(override.itemID)) {
            return override.itemID;
        }

        knownOverrides.add(override.itemID);
    }

    return undefined;
}

function getOverriddenRequirements(
    inputItemID: string,
    items: TranslatedItem[],
    overrides?: CreatorOverride[],
): TranslatedItem[] {
    if (!overrides) {
        return items;
    }

    const filtered = filterByCreatorOverrides(inputItemID, items, overrides);
    if (canCreateItem(inputItemID, filtered)) {
        return filtered;
    }

    throw new Error(INVALID_OVERRIDE_ITEM_NOT_CREATABLE_ERROR);
}

async function getRequiredItemDetails(
    id: string,
    locale?: string,
): Promise<TranslatedItem[]> {
    try {
        return await queryRequirementsDB({
            id,
            locale: locale ?? DEFAULT_LOCALE,
        });
    } catch {
        throw new Error(INTERNAL_SERVER_ERROR);
    }
}

function getRecipeKey(
    recipeName: string,
    creator: string,
    outputItem = recipeName,
): string {
    return `${recipeName}-${creator}-${outputItem}`;
}

function createRecipeDemandMap(
    variables: [string, number][],
    itemMap: Map<string, TranslatedItem>,
): Map<string, Demand[]> {
    const map = new Map<string, Demand[]>();
    const demandVariables = variables.filter(([key]) =>
        isRequirementVariable(key),
    );

    for (const [key, amount] of demandVariables) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, itemID, creatorID, requirementID] = key.split("-");
        if (!itemID || !creatorID || !requirementID) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const recipeDemandKey = getRecipeKey(itemID, creatorID);
        const currentDemands = map.get(recipeDemandKey) ?? [];

        // Find any item with this ID to get the translated name
        const requirementItem = [...itemMap.values()].find(
            (item) => item.id === requirementID,
        );
        const translatedName = requirementItem?.name ?? requirementID;

        map.set(
            recipeDemandKey,
            currentDemands.concat([{ name: translatedName, amount }]),
        );
    }

    return map;
}

function createRecipeMap(
    variables: [string, number][],
    itemMap: Map<string, TranslatedItem>,
): [Map<string, string[]>, Map<string, RequirementRecipe>] {
    const itemRecipeMap = new Map<string, string[]>();
    const recipeMap = new Map<string, RequirementRecipe>();

    const productionOutputVariables = variables.filter(
        ([key]) => isProductionVariable(key) || isOutputVariable(key),
    );

    for (const [key, value] of productionOutputVariables) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, recipeID, creatorID, outputItemID] = key.split("-");
        if (!recipeID || !creatorID || !outputItemID) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const recipeKey = getRecipeKey(recipeID, creatorID, outputItemID);
        const itemRecipeKeys = itemRecipeMap.get(outputItemID) ?? [];
        if (!itemRecipeKeys.includes(recipeKey)) {
            itemRecipeMap.set(outputItemID, itemRecipeKeys.concat([recipeKey]));
        }

        const item = itemMap.get(`${recipeID}-${creatorID}`);
        const translatedName = item?.name ?? recipeID;
        const translatedCreator = item?.creator ?? creatorID;

        const currentRecipeDetails = recipeMap.get(recipeKey) ?? {
            name: translatedName,
            creator: translatedCreator,
            amount: 0,
            workers: 0,
            demands: [],
        };
        recipeMap.set(recipeKey, {
            ...currentRecipeDetails,
            ...(isProductionVariable(key) && { workers: value }),
            ...(isOutputVariable(key) && { amount: value }),
        });
    }

    return [itemRecipeMap, recipeMap];
}

function mapResults(
    inputItemID: string,
    items: TranslatedItem[],
    results?: VertexOutput,
): Requirement[] {
    if (!results) {
        return [];
    }

    const itemMap = new Map<string, TranslatedItem>(
        items.map((item) => [createVariableName(item), item]),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bounded, ...variables } = results;
    const variablesArray = Object.entries(variables);

    const recipeDemandMap = createRecipeDemandMap(variablesArray, itemMap);
    const [itemRecipeMap, recipeCreatorMap] = createRecipeMap(
        variablesArray,
        itemMap,
    );

    const totalOutputVariables = variablesArray.filter(([key]) =>
        isTotalVariable(key),
    );

    const result: Requirement[] = [];
    for (const [totalKey, amount] of totalOutputVariables) {
        // Ignore items that have zero requirement
        if (amount === 0) {
            continue;
        }

        const creators = itemRecipeMap.get(totalKey);
        if (!creators) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const creatorsWithDemands = creators.map((creator) => {
            const recipe = recipeCreatorMap.get(creator);
            if (!recipe) {
                throw new Error(INTERNAL_SERVER_ERROR);
            }

            const demands = recipeDemandMap.get(creator);

            return { ...recipe, demands: demands ?? [] };
        });

        const translatedItem = [...itemMap.values()].find(
            (item) => item.id === totalKey,
        );
        const translatedName = translatedItem?.name ?? totalKey;

        const mapped = {
            name: translatedName,
            amount,
            creators: creatorsWithDemands.filter(
                (creator) => creator.workers > 0,
            ),
        };

        if (totalKey === inputItemID) {
            result.unshift(mapped);
        } else {
            result.push(mapped);
        }
    }

    return result;
}

function validateInput(
    input: QueryRequirementsParams,
): QueryRequirementsParams {
    if (input.id === "") {
        throw new Error(INVALID_ITEM_ID_ERROR);
    }

    if ("workers" in input && input.workers <= 0) {
        throw new Error(INVALID_WORKERS_ERROR);
    }

    if ("amount" in input && input.amount <= 0) {
        throw new Error(INVALID_TARGET_ERROR);
    }

    return input;
}

const queryRequirements: QueryRequirementsPrimaryPort = async (input) => {
    const {
        id,
        maxAvailableTool = "none" as DefaultToolset,
        hasMachineTools = false,
        unit = OutputUnit.SECONDS,
        creatorOverrides,
        locale,
        ...target
    } = validateInput(input);
    console.log({
        key: "Requirements Input",
        parameters: JSON.stringify(input),
    });

    const multipleOverride = findMultipleOverrides(creatorOverrides);
    if (multipleOverride) {
        throw new Error(
            `${MULTIPLE_OVERRIDE_ERROR_PREFIX} ${multipleOverride}`,
        );
    }

    const requirements = await getRequiredItemDetails(id, locale);
    if (requirements.length == 0) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const overriddenRequirements = getOverriddenRequirements(
        id,
        requirements,
        creatorOverrides,
    );

    const required = hasMinimumRequiredTools(
        overriddenRequirements,
        maxAvailableTool,
        hasMachineTools,
    );
    if (!required.hasRequired) {
        const errorSuffix =
            required.requiredTool === "machine"
                ? "requires machine tools"
                : `minimum tool is: ${required.requiredTool}`;
        throw new Error(`${TOOL_LEVEL_ERROR_PREFIX} ${errorSuffix}`);
    }

    const result = computeRequirementVertices({
        inputItemID: id,
        target,
        requirements: overriddenRequirements,
        maxAvailableTool,
        hasMachineTools,
        unit,
    });

    return mapResults(id, overriddenRequirements, result);
};

export { queryRequirements };
