import solver, { IMultiObjectiveModel, IModelBase } from "javascript-lp-solver";

import { Item, Items, DefaultToolset } from "../../../types";
import { INTERNAL_SERVER_ERROR, UNKNOWN_ITEM_ERROR } from "./errors";
import { calculateCreateTime, groupItemsByName } from "./item-utils";
import { isAvailableToolSufficient } from "../../../common";

export const WORKERS_PROPERTY = "workers";
export const REQUIREMENT_PREFIX = "requirement-";
export const PRODUCTION_PREFIX = "production-";
export const OUTPUT_PREFIX = "output-";

type Constraints = IModelBase["constraints"];
type Variables = IModelBase["variables"];
type VariableProperties = NonNullable<Variables[number]>;

type ProgramInput = {
    inputItemName: string;
    target: { workers: number } | { amount: number };
    requirements: Items;
    maxAvailableTool: DefaultToolset;
    hasMachineTools: boolean;
};

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
    maxAvailableTool: DefaultToolset,
    hasMachineTools: boolean
): Items {
    return items.filter((item) =>
        isAvailableToolSufficient(maxAvailableTool, hasMachineTools, item)
    );
}

function createBaseOutputPropertyName(itemName: string) {
    return `${itemName}#base`;
}

function createRecipeDemandVariableName(
    recipe: Pick<Item, "name" | "creator">,
    demand: string
) {
    return `${REQUIREMENT_PREFIX}${createVariableName(recipe)}-${demand}`;
}

function createRecipeProductionVariableName(
    recipe: Pick<Item, "name" | "creator">,
    product: string
): string {
    return `${PRODUCTION_PREFIX}${createVariableName(recipe)}-${product}`;
}

function createRecipeOutputVariableName(
    recipe: Pick<Item, "name" | "creator">,
    output: string
): string {
    return `${OUTPUT_PREFIX}${createVariableName(recipe)}-${output}`;
}

function createDemandVariables(
    items: Readonly<Items>,
    maxAvailableTool: DefaultToolset,
    inputItemName: string
): Variables {
    const recipeMap = groupItemsByName(items);

    const inputItemWorkersPropertyName =
        createInputWorkersPropertyName(inputItemName);

    const variables: Variables = {};
    for (const [itemName, recipes] of recipeMap.entries()) {
        const totalOutputVariable: VariableProperties = {};

        // Set total output properties
        const baseItemOutputPropertyName =
            createBaseOutputPropertyName(itemName);
        totalOutputVariable[itemName] = 1;
        totalOutputVariable[baseItemOutputPropertyName] = -1;

        for (const recipe of recipes) {
            const recipeVariable: VariableProperties = {};
            const baseRecipeOutputPropertyName = createRecipeOutputVariableName(
                recipe,
                recipe.name
            );

            // Set recipe output properties
            const createTime = calculateCreateTime(recipe, maxAvailableTool);
            recipeVariable[baseRecipeOutputPropertyName] =
                recipe.output / createTime;

            // Create base output to recipe output mapping
            const recipeOutputVariable: VariableProperties = {};
            recipeOutputVariable[baseRecipeOutputPropertyName] = -1;
            recipeOutputVariable[baseItemOutputPropertyName] = 1;
            variables[baseRecipeOutputPropertyName] = recipeOutputVariable;

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
                const recipeDemandVariableName = createRecipeDemandVariableName(
                    recipe,
                    requirement.name
                );
                recipeVariable[recipeDemandVariableName] =
                    (requirement.amount / createTime) * -1;

                // Add linking properties
                specificRecipeRequirementVariable[requirement.name] = -1;
                specificRecipeRequirementVariable[recipeDemandVariableName] = 1;

                variables[recipeDemandVariableName] =
                    specificRecipeRequirementVariable;
            }

            // Set optional output properties
            for (const optional of recipe.optionalOutputs ?? []) {
                const baseOptionalOutputPropertyName =
                    createBaseOutputPropertyName(optional.name);

                // If optional output is same as base recipe, update base recipe output
                // rather than adding separate output
                const optionalOutput =
                    (optional.amount / createTime) * optional.likelihood;
                if (optional.name === recipe.name) {
                    const newOutput =
                        (recipeVariable[baseRecipeOutputPropertyName] ?? 0) +
                        optionalOutput;
                    recipeVariable[baseRecipeOutputPropertyName] = newOutput;
                    continue;
                }

                const recipeProductionVariableName =
                    createRecipeProductionVariableName(recipe, optional.name);
                const recipeOptionalOutputVariableName =
                    createRecipeOutputVariableName(recipe, optional.name);

                // Create/Update optional output recipe variable
                const currentOutputVariable =
                    variables[recipeProductionVariableName] ?? {};
                const currentOutput =
                    currentOutputVariable[recipeOptionalOutputVariableName] ??
                    0;
                const newOutput = currentOutput + optionalOutput;
                currentOutputVariable[recipeOptionalOutputVariableName] =
                    newOutput;

                // Add production linking properties
                recipeVariable[recipeProductionVariableName] = 1;
                currentOutputVariable[recipeProductionVariableName] = -1;

                // Create output linking variable
                const optionalOutputVariable: VariableProperties = {};
                optionalOutputVariable[recipeOptionalOutputVariableName] = -1;
                optionalOutputVariable[baseOptionalOutputPropertyName] = 1;
                variables[recipeOptionalOutputVariableName] =
                    optionalOutputVariable;

                variables[recipeProductionVariableName] = currentOutputVariable;
            }

            variables[createRecipeProductionVariableName(recipe, recipe.name)] =
                recipeVariable;
        }

        variables[itemName] = totalOutputVariable;
    }

    return variables;
}

function createMinimumConstraints(
    variables: Readonly<Variables>
): Readonly<Constraints> {
    const uniqueConstraints: Constraints = {};
    for (const properties of Object.values(variables)) {
        for (const property of Object.keys(properties ?? {})) {
            uniqueConstraints[property] = { min: 0 };
        }
    }

    return uniqueConstraints;
}

function createOutputConstraints(
    variables: Readonly<Variables>
): Readonly<Constraints> {
    const outputConstraints: Constraints = {};
    for (const [key, properties] of Object.entries(variables)) {
        if (!isOutputVariable(key) || !properties) {
            continue;
        }

        for (const property of Object.keys(properties)) {
            outputConstraints[property] = { equal: 0 };
        }
    }

    return outputConstraints;
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

function createTargetConstraint(
    inputItemName: string,
    target: ProgramInput["target"]
): Readonly<Constraints> {
    if ("workers" in target) {
        const inputWorkersConstraintName =
            createInputWorkersPropertyName(inputItemName);

        return { [inputWorkersConstraintName]: { equal: target.workers } };
    }

    return { [inputItemName]: { equal: target.amount } };
}

function computeRequirementVertices({
    inputItemName,
    requirements,
    maxAvailableTool,
    hasMachineTools,
    target,
}: ProgramInput): VertexOutput | undefined {
    const availableItems = convertRequirementsToMap(requirements);
    const input = availableItems.get(inputItemName);
    if (!input) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const createAbleItems = filterCreatable(
        requirements,
        maxAvailableTool,
        hasMachineTools
    );
    const variables = createDemandVariables(
        createAbleItems,
        maxAvailableTool,
        inputItemName
    );

    const demandConstraints = createMinimumConstraints(variables);
    const outputConstraints = createOutputConstraints(variables);
    const targetConstraint = createTargetConstraint(inputItemName, target);

    const model: IMultiObjectiveModel = {
        optimize: {
            [inputItemName]: "max",
            [WORKERS_PROPERTY]: "min",
        },
        constraints: {
            ...demandConstraints,
            ...outputConstraints,
            ...targetConstraint,
        },
        variables: variables,
    };

    const result = solver.MultiObjective(model) as LinearProgramOutput;
    return getVertexWithHighestOutputAndLowestWorkers(
        inputItemName,
        result.vertices
    );
}

function isProductionVariable(variableName: string): boolean {
    return variableName.startsWith(PRODUCTION_PREFIX);
}

function isRequirementVariable(variableName: string): boolean {
    return variableName.startsWith(REQUIREMENT_PREFIX);
}

function isOutputVariable(variableName: string): boolean {
    return variableName.startsWith(OUTPUT_PREFIX);
}

function isTotalVariable(variableName: string): boolean {
    return (
        !isProductionVariable(variableName) &&
        !isRequirementVariable(variableName) &&
        !isOutputVariable(variableName) &&
        variableName !== WORKERS_PROPERTY
    );
}

export {
    computeRequirementVertices,
    isProductionVariable,
    isRequirementVariable,
    isOutputVariable,
    isTotalVariable,
};
