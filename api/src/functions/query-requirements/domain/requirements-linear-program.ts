import solver, { IMultiObjectiveModel, IModelBase } from "javascript-lp-solver";

import { Item, Items, Tools } from "../../../types";
import { INTERNAL_SERVER_ERROR, UNKNOWN_ITEM_ERROR } from "./errors";
import { calculateCreateTime, groupItemsByName } from "./item-utils";
import { isAvailableToolSufficient } from "../../../common/modifiers";

export const WORKERS_PROPERTY = "workers";

type Constraints = IModelBase["constraints"];
type Variables = IModelBase["variables"];
type VariableProperties = Variables[number];

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

function createMultiObjectiveModel(
    items: Items,
    inputItemName: string,
    workers: number,
    maxAvailableTool: Tools
): IMultiObjectiveModel {
    const recipeMap = groupItemsByName(items);
    const constraints: Constraints = {};

    // Set input item total workers constraint
    const outputWorkersPropertyName =
        createInputWorkersPropertyName(inputItemName);
    constraints[outputWorkersPropertyName] = { equal: workers };

    for (const { name } of items) {
        // Set minimum output constraint (non-negative)
        constraints[name] = { min: 0 };
    }

    const variables: Variables = {};
    for (const item of items) {
        // Skip if not creatable
        if (!isAvailableToolSufficient(item.minimumTool, maxAvailableTool)) {
            continue;
        }

        const properties: VariableProperties = {};

        // Set worker properties
        properties[WORKERS_PROPERTY] = 1;
        if (item.name === inputItemName) {
            properties[outputWorkersPropertyName] = 1;
        }

        // Set base output properties
        const createTime = calculateCreateTime(item, maxAvailableTool);
        properties[item.name] = item.output / createTime;

        // Set base requirement properties
        for (const requirement of item.requires) {
            // Throw an error if no recipes exist for provided item
            if (!recipeMap.get(requirement.name)) {
                throw new Error(INTERNAL_SERVER_ERROR);
            }

            properties[requirement.name] =
                (requirement.amount / createTime) * -1;
        }

        // Set optional output properties (Updating demand/output as may be additional)
        for (const optional of item.optionalOutputs ?? []) {
            const currentOutput = properties[optional.name] ?? 0;
            const optionalOutput =
                (optional.amount / createTime) * optional.likelihood;
            properties[optional.name] = currentOutput + optionalOutput;
        }

        variables[createVariableName(item)] = properties;
    }

    return {
        optimize: {
            [inputItemName]: "max",
            [WORKERS_PROPERTY]: "min",
        },
        constraints,
        variables,
    };
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
    const model = createMultiObjectiveModel(
        requirements,
        inputItemName,
        workers,
        maxAvailableTool
    );

    const result = solver.MultiObjective(model) as LinearProgramOutput;
    return getVertexWithHighestOutputAndLowestWorkers(
        inputItemName,
        result.vertices
    );
}

export { computeRequirementVertices };
