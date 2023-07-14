import solver, { IMultiObjectiveModel, IModelBase } from "javascript-lp-solver";

import { Item, Items, Tools } from "../../../types";
import { INTERNAL_SERVER_ERROR, UNKNOWN_ITEM_ERROR } from "./errors";
import { calculateCreateTime, groupItemsByName } from "./item-utils";
import { isAvailableToolSufficient } from "../../../common/modifiers";

export const WORKERS_PROPERTY = "workers";
export const REQUIREMENT_PREFIX = "requirement-";
export const RECIPE_PREFIX = "recipe-";

type Constraints = IModelBase["constraints"];
type Variables = IModelBase["variables"];
type VariableProperties = NonNullable<Variables[number]>;

export type VertexOutput = {
    [key: string]: number;
} & {
    bounded: boolean;
};
type LinearProgramOutput = { vertices: VertexOutput[] | undefined };

function convertRequirementsToMap(requirements: Items): Map<string, Item> {
    const requirementMap = new Map<string, Item>();
    for (const requirement of requirements) {
        requirementMap.set(requirement.name, requirement);
    }

    return requirementMap;
}

function createInputWorkersPropertyName(inputItemName: string): string {
    return `${inputItemName}-${WORKERS_PROPERTY}`;
}

function createVariableName({
    name,
    creator,
}: Pick<Item, "name" | "creator">): string {
    return `${name}-${creator}`;
}

function filterCreatable(
    items: Readonly<Items>,
    maxAvailableTool: Tools
): Items {
    return items.filter((item) =>
        isAvailableToolSufficient(item.minimumTool, maxAvailableTool)
    );
}

function createBaseOutputPropertyName(itemName: string) {
    return `${itemName}-base`;
}

function createSpecificRecipeRequirementPropertyName(
    itemName: string,
    requiring: Pick<Item, "name" | "creator">
) {
    return `${REQUIREMENT_PREFIX}${requiring.name}-${requiring.creator}-${itemName}`;
}

function createDemandVariables(
    items: Readonly<Items>,
    maxAvailableTool: Tools,
    inputItemName: string
): Variables {
    const recipeMap = groupItemsByName(items);

    const inputItemWorkersPropertyName =
        createInputWorkersPropertyName(inputItemName);

    const variables: Variables = {};
    for (const [itemName, recipes] of recipeMap.entries()) {
        const totalOutputVariable: VariableProperties = {};

        // Set total output properties
        const baseItemPropertyName = createBaseOutputPropertyName(itemName);
        totalOutputVariable[itemName] = 1;
        totalOutputVariable[baseItemPropertyName] = -1;

        for (const recipe of recipes) {
            const recipeVariable: VariableProperties = {};

            // Set recipe output properties
            const createTime = calculateCreateTime(recipe, maxAvailableTool);
            recipeVariable[baseItemPropertyName] = recipe.output / createTime;

            // Set worker properties
            recipeVariable[WORKERS_PROPERTY] = 1;
            if (itemName === inputItemName) {
                recipeVariable[inputItemWorkersPropertyName] = 1;
            }

            // Set base requirement properties
            for (const requirement of recipe.requires) {
                // Throw an error if no recipes exist for provided item
                if (!recipeMap.get(requirement.name)) {
                    throw new Error(INTERNAL_SERVER_ERROR);
                }

                const specificRecipeRequirementVariable: VariableProperties =
                    {};

                // Create specific recipe output properties
                const specificRecipeRequirementPropertyName =
                    createSpecificRecipeRequirementPropertyName(
                        requirement.name,
                        recipe
                    );
                specificRecipeRequirementVariable[requirement.name] = -1;
                specificRecipeRequirementVariable[
                    specificRecipeRequirementPropertyName
                ] = 1;

                recipeVariable[specificRecipeRequirementPropertyName] =
                    (requirement.amount / createTime) * -1;
                variables[specificRecipeRequirementPropertyName] =
                    specificRecipeRequirementVariable;
            }

            // Set optional output properties
            for (const optional of recipe.optionalOutputs ?? []) {
                const baseItemPropertyName = createBaseOutputPropertyName(
                    optional.name
                );
                const currentOutput = recipeVariable[baseItemPropertyName] ?? 0;
                const optionalOutput =
                    (optional.amount / createTime) * optional.likelihood;
                recipeVariable[optional.name] = currentOutput + optionalOutput;
            }

            variables[`${RECIPE_PREFIX}${createVariableName(recipe)}`] =
                recipeVariable;
        }

        variables[itemName] = totalOutputVariable;
    }

    return variables;
}

function createDemandConstraints(
    variables: Readonly<Variables>,
    inputItemName: string
): Constraints {
    const uniqueConstraints: Constraints = {};
    const inputItemWorkerVariable =
        createInputWorkersPropertyName(inputItemName);
    for (const properties of Object.values(variables)) {
        for (const property of Object.keys(properties ?? {})) {
            if (
                property !== WORKERS_PROPERTY &&
                property !== inputItemWorkerVariable
            ) {
                uniqueConstraints[property] = { min: 0 };
            }
        }
    }

    return uniqueConstraints;
}

function getVertexWithHighestOutputAndLowestWorkers(
    inputItemName: string,
    vertices: VertexOutput[] | undefined
): VertexOutput | undefined {
    if (!vertices || vertices.length === 0) {
        return undefined;
    }

    let currentBest = vertices[0] as VertexOutput;
    for (const vertex of vertices) {
        const currentBestOutput = currentBest[inputItemName] ?? 0;
        const vertexOutput = vertex[inputItemName] ?? 0;
        const currentBestWorkers = currentBest[WORKERS_PROPERTY] ?? 0;
        const vertexWorkers = vertex[WORKERS_PROPERTY] ?? 0;

        if (
            vertexOutput > currentBestOutput ||
            (vertexOutput === currentBestOutput &&
                vertexWorkers < currentBestWorkers)
        ) {
            currentBest = vertex;
        }
    }

    return currentBest;
}

function computeRequirementVertices(
    inputItemName: string,
    workers: number,
    requirements: Items,
    maxAvailableTool: Tools
): VertexOutput | undefined {
    const availableItems = convertRequirementsToMap(requirements);
    const input = availableItems.get(inputItemName);
    if (!input) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const createAbleItems = filterCreatable(requirements, maxAvailableTool);
    const variables = createDemandVariables(
        createAbleItems,
        maxAvailableTool,
        inputItemName
    );

    const demandConstraints = createDemandConstraints(variables, inputItemName);
    demandConstraints[createInputWorkersPropertyName(inputItemName)] = {
        equal: workers,
    };

    const model: IMultiObjectiveModel = {
        optimize: {
            [inputItemName]: "max",
            [WORKERS_PROPERTY]: "min",
        },
        constraints: demandConstraints,
        variables: variables,
    };

    const result = solver.MultiObjective(model) as LinearProgramOutput;

    return getVertexWithHighestOutputAndLowestWorkers(
        inputItemName,
        result.vertices
    );
}

export { computeRequirementVertices };
