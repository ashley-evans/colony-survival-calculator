import type {
    CreatorOverride,
    Demand,
    QueryRequirementsParams,
    QueryRequirementsPrimaryPort,
    RequirementRecipe,
} from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import { Items, DefaultToolset } from "../../../types";
import { hasMinimumRequiredTools, OutputUnit } from "../../../common";
import { Requirement } from "../interfaces/query-requirements-primary-port";
import {
    VertexOutput,
    computeRequirementVertices,
    isOutputVariable,
    isProductionVariable,
    isRequirementVariable,
    isTotalVariable,
} from "./requirements-linear-program";
import {
    INTERNAL_SERVER_ERROR,
    INVALID_ITEM_NAME_ERROR,
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
        if (knownOverrides.has(override.itemName)) {
            return override.itemName;
        }

        knownOverrides.add(override.itemName);
    }

    return undefined;
}

function getOverriddenRequirements(
    inputItemName: string,
    items: Items,
    overrides?: CreatorOverride[],
) {
    if (!overrides) {
        return items;
    }

    const filtered = filterByCreatorOverrides(inputItemName, items, overrides);
    if (canCreateItem(inputItemName, filtered)) {
        return filtered;
    }

    throw new Error(INVALID_OVERRIDE_ITEM_NOT_CREATABLE_ERROR);
}

async function getRequiredItemDetails(name: string): Promise<Items> {
    try {
        return await queryRequirementsDB(name);
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
): Map<string, Demand[]> {
    const map = new Map<string, Demand[]>();
    const demandVariables = variables.filter(([key]) =>
        isRequirementVariable(key),
    );

    for (const [key, amount] of demandVariables) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, itemName, creator, requirement] = key.split("-");
        if (!itemName || !creator || !requirement) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const recipeDemandKey = getRecipeKey(itemName, creator);
        const currentDemands = map.get(recipeDemandKey) ?? [];
        map.set(
            recipeDemandKey,
            currentDemands.concat([{ name: requirement, amount }]),
        );
    }

    return map;
}

function createRecipeMap(
    variables: [string, number][],
): [Map<string, string[]>, Map<string, RequirementRecipe>] {
    const itemRecipeMap = new Map<string, string[]>();
    const recipeMap = new Map<string, RequirementRecipe>();

    const productionOutputVariables = variables.filter(
        ([key]) => isProductionVariable(key) || isOutputVariable(key),
    );

    for (const [key, value] of productionOutputVariables) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, recipeName, creator, outputItem] = key.split("-");
        if (!recipeName || !creator || !outputItem) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const recipeKey = getRecipeKey(recipeName, creator, outputItem);
        const itemRecipeKeys = itemRecipeMap.get(outputItem) ?? [];
        if (!itemRecipeKeys.includes(recipeKey)) {
            itemRecipeMap.set(outputItem, itemRecipeKeys.concat([recipeKey]));
        }

        const currentRecipeDetails = recipeMap.get(recipeKey) ?? {
            name: recipeName,
            creator,
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
    inputItemName: string,
    results?: VertexOutput,
): Requirement[] {
    if (!results) {
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bounded, ...variables } = results;
    const variablesArray = Object.entries(variables);

    const recipeDemandMap = createRecipeDemandMap(variablesArray);
    const [itemRecipeMap, recipeCreatorMap] = createRecipeMap(variablesArray);

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

        const mapped = {
            name: totalKey,
            amount,
            creators: creatorsWithDemands.filter(
                (creator) => creator.workers > 0,
            ),
        };

        if (totalKey === inputItemName) {
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
    if (input.name === "") {
        throw new Error(INVALID_ITEM_NAME_ERROR);
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
        name,
        maxAvailableTool = DefaultToolset.none,
        hasMachineTools = false,
        unit = OutputUnit.SECONDS,
        creatorOverrides,
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

    const requirements = await getRequiredItemDetails(name);
    if (requirements.length == 0) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const overriddenRequirements = getOverriddenRequirements(
        name,
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
        inputItemName: name,
        target,
        requirements: overriddenRequirements,
        maxAvailableTool,
        hasMachineTools,
        unit,
    });

    return mapResults(name, result);
};

export { queryRequirements };
