import GLPK, { LP, Result } from "glpk.js";

import type { QueryRequirementsPrimaryPort } from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import { Item, Items, Tools } from "../../../types";
import {
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";
import { RequiredWorkers } from "../interfaces/query-requirements-primary-port";

const glpk = GLPK();

const INVALID_ITEM_NAME_ERROR =
    "Invalid item name provided, must be a non-empty string";
const INVALID_WORKERS_ERROR =
    "Invalid number of workers provided, must be a positive number";
const UNKNOWN_ITEM_ERROR = "Unknown item provided";
const TOOL_LEVEL_ERROR_PREFIX =
    "Unable to create item with available tools, minimum tool is:";
const INTERNAL_SERVER_ERROR = "Internal server error";

type Constraint = LP["subjectTo"][number];
type ObjectiveVariable = LP["objective"]["vars"][number];
type ResultVariables = Result["result"]["vars"];
type DemandingItemDetails = Omit<Item, "requires"> & { requiredAmount: number };

async function getRequiredItemDetails(name: string): Promise<Items> {
    try {
        return await queryRequirementsDB(name);
    } catch {
        throw new Error(INTERNAL_SERVER_ERROR);
    }
}

function hasRequiredTools(items: Items, maxAvailableTool: Tools) {
    for (const item of items) {
        if (!isAvailableToolSufficient(item.minimumTool, maxAvailableTool)) {
            throw new Error(`${TOOL_LEVEL_ERROR_PREFIX} ${item.minimumTool}`);
        }
    }
}

function convertRequirementsToMap(requirements: Items): Map<string, Item> {
    const requirementMap = new Map<string, Item>();
    for (const requirement of requirements) {
        requirementMap.set(requirement.name, requirement);
    }

    return requirementMap;
}

function convertRequirementsToDemandMap(
    requirements: Items
): Map<string, DemandingItemDetails[]> {
    const demandMap = new Map<string, DemandingItemDetails[]>();
    for (const requirement of requirements) {
        for (const demand of requirement.requires) {
            const existingDemands = demandMap.get(demand.name);
            if (existingDemands) {
                existingDemands.push({
                    ...requirement,
                    requiredAmount: demand.amount,
                });
            } else {
                demandMap.set(demand.name, [
                    { ...requirement, requiredAmount: demand.amount },
                ]);
            }
        }
    }

    return demandMap;
}

function calculateCreateTime(
    item: Pick<Item, "maximumTool" | "createTime">,
    availableTool: Tools
) {
    const toolModifier = getMaxToolModifier(item.maximumTool, availableTool);
    return item.createTime / toolModifier;
}

function createLinearProgram(
    inputItemName: string,
    workers: number,
    requirements: Items,
    maxAvailableTool: Tools
): LP {
    const availableItems = convertRequirementsToMap(requirements);
    const input = availableItems.get(inputItemName);
    if (!input) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const outputWorkersConstraint: Constraint = {
        name: "output-workers-constraint",
        vars: [{ name: input.name, coef: 1 }],
        bnds: { type: glpk.GLP_LO, lb: workers, ub: workers },
    };

    const constraints: Constraint[] = [outputWorkersConstraint];
    const objectiveVariables: ObjectiveVariable[] = [];

    const demandMap = convertRequirementsToDemandMap(requirements);
    for (const [demandName, demandingItems] of Array.from(demandMap)) {
        const demandedItem = availableItems.get(demandName);
        if (!demandedItem) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const demandedItemCreateTime = calculateCreateTime(
            demandedItem,
            maxAvailableTool
        );

        objectiveVariables.push({ name: demandedItem.name, coef: 1 });

        const overallDemandConstraint: Constraint = {
            name: `${demandedItem.name}-overall-demand`,
            vars: [
                {
                    name: demandedItem.name,
                    coef: demandedItem.output / demandedItemCreateTime,
                },
            ],
            bnds: { type: glpk.GLP_LO, lb: 0, ub: 0 },
        };

        for (const demandingItem of demandingItems) {
            const demandingItemCreateTime = calculateCreateTime(
                demandingItem,
                maxAvailableTool
            );

            overallDemandConstraint.vars.push({
                name: demandingItem.name,
                coef:
                    (demandingItem.requiredAmount / demandingItemCreateTime) *
                    -1,
            });
        }

        constraints.push(overallDemandConstraint);
    }

    return {
        name: `Worker requirements for: ${input.name}, workers: ${workers}`,
        objective: {
            direction: glpk.GLP_MIN,
            name: "Total workers",
            vars: objectiveVariables,
        },
        subjectTo: constraints,
    };
}

function mapResults(
    inputItemName: string,
    results: ResultVariables
): RequiredWorkers[] {
    const requiredWorkers: RequiredWorkers[] = [];
    for (const [itemName, workers] of Object.entries(results)) {
        if (itemName != inputItemName) {
            requiredWorkers.push({ name: itemName, workers });
        }
    }

    return requiredWorkers;
}

const queryRequirements: QueryRequirementsPrimaryPort = async (
    name: string,
    workers: number,
    maxAvailableTool: Tools = Tools.none
) => {
    if (name === "") {
        throw new Error(INVALID_ITEM_NAME_ERROR);
    }

    if (workers <= 0) {
        throw new Error(INVALID_WORKERS_ERROR);
    }

    const requirements = await getRequiredItemDetails(name);
    if (requirements.length == 0) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    hasRequiredTools(requirements, maxAvailableTool);
    const program = createLinearProgram(
        name,
        workers,
        requirements,
        maxAvailableTool
    );

    const output = glpk.solve(program);
    return mapResults(name, output.result.vars);
};

export { queryRequirements };
