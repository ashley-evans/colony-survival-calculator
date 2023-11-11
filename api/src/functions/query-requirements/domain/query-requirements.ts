import type {
    CreatorOverride,
    Demand,
    QueryRequirementsPrimaryPort,
    RequirementRecipe,
} from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import { Items, DefaultToolset } from "../../../types";
import {
    hasMinimumRequiredTools,
    OutputUnit,
    OutputUnitSecondMappings,
} from "../../../common";
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
    INVALID_WORKERS_ERROR,
    MULTIPLE_OVERRIDE_ERROR_PREFIX,
    TOOL_LEVEL_ERROR_PREFIX,
    UNKNOWN_ITEM_ERROR,
} from "./errors";
import { canCreateItem, filterByCreatorOverrides } from "./item-utils";

function findMultipleOverrides(
    overrides?: CreatorOverride[]
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
    overrides?: CreatorOverride[]
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
    outputItem = recipeName
): string {
    return `${recipeName}-${creator}-${outputItem}`;
}

function createRecipeDemandMap(
    variables: [string, number][]
): Map<string, Demand[]> {
    const map = new Map<string, Demand[]>();
    const demandVariables = variables.filter(([key]) =>
        isRequirementVariable(key)
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
            currentDemands.concat([{ name: requirement, amount }])
        );
    }

    return map;
}

function createRecipeMap(
    variables: [string, number][]
): [Map<string, string[]>, Map<string, RequirementRecipe>] {
    const itemRecipeMap = new Map<string, string[]>();
    const recipeMap = new Map<string, RequirementRecipe>();

    const productionOutputVariables = variables.filter(
        ([key]) => isProductionVariable(key) || isOutputVariable(key)
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

function mapResults(results?: VertexOutput): Requirement[] {
    if (!results) {
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bounded, ...variables } = results;
    const variablesArray = Object.entries(variables);

    const recipeDemandMap = createRecipeDemandMap(variablesArray);
    const [itemRecipeMap, recipeCreatorMap] = createRecipeMap(variablesArray);

    const totalOutputVariables = variablesArray.filter(([key]) =>
        isTotalVariable(key)
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

        result.push({
            name: totalKey,
            amount,
            creators: creatorsWithDemands.filter(
                (creator) => creator.workers > 0
            ),
        });
    }

    return result;
}

function applyOutputUnit(
    requirements: Requirement[],
    unit: OutputUnit
): Requirement[] {
    const factor = OutputUnitSecondMappings[unit];

    return requirements.map((requirement) => {
        const creators = requirement.creators.map((creator) => {
            const demands = creator.demands.map((demand) => {
                return {
                    ...demand,
                    amount: factor * demand.amount,
                };
            });

            return {
                ...creator,
                demands,
                amount: factor * creator.amount,
            };
        });

        return {
            ...requirement,
            creators,
            amount: factor * requirement.amount,
        };
    });
}

const queryRequirements: QueryRequirementsPrimaryPort = async ({
    name,
    workers,
    maxAvailableTool = DefaultToolset.none,
    hasMachineTools = false,
    hasEyeglasses = false,
    unit = OutputUnit.SECONDS,
    creatorOverrides,
}) => {
    if (name === "") {
        throw new Error(INVALID_ITEM_NAME_ERROR);
    }

    if (workers <= 0) {
        throw new Error(INVALID_WORKERS_ERROR);
    }

    const multipleOverride = findMultipleOverrides(creatorOverrides);
    if (multipleOverride) {
        throw new Error(
            `${MULTIPLE_OVERRIDE_ERROR_PREFIX} ${multipleOverride}`
        );
    }

    const requirements = await getRequiredItemDetails(name);
    if (requirements.length == 0) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const overriddenRequirements = getOverriddenRequirements(
        name,
        requirements,
        creatorOverrides
    );

    const required = hasMinimumRequiredTools(
        overriddenRequirements,
        maxAvailableTool,
        hasMachineTools,
        hasEyeglasses
    );
    if (!required.hasRequired) {
        if (required.requiredTool === "machine") {
            throw new Error(
                `${TOOL_LEVEL_ERROR_PREFIX} requires machine tools`
            );
        }

        if (required.requiredTool === "glasses") {
            throw new Error(`${TOOL_LEVEL_ERROR_PREFIX} requires eyeglasses`);
        }

        throw new Error(
            `${TOOL_LEVEL_ERROR_PREFIX} minimum tool is: ${required.requiredTool}`
        );
    }

    const result = computeRequirementVertices(
        name,
        workers,
        overriddenRequirements,
        maxAvailableTool,
        hasMachineTools,
        hasEyeglasses
    );

    const mapped = mapResults(result);
    return unit !== OutputUnit.SECONDS ? applyOutputUnit(mapped, unit) : mapped;
};

export { queryRequirements };
