import GLPK, { LP, Result } from "glpk.js";

import type { QueryRequirementsPrimaryPort } from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import { Item, Items, OptionalOutput, Tools } from "../../../types";
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
type OutputDetails = Pick<Item, "output" | "createTime" | "maximumTool"> &
    Partial<Pick<OptionalOutput, "likelihood">>;
type IOItemDetails = {
    demanding: DemandingItemDetails[];
    outputting: OutputDetails[];
};

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

function convertItemsToIOMap(items: Items): Map<string, IOItemDetails> {
    const outputMap = new Map<string, IOItemDetails>();
    for (const item of items) {
        const itemIODetails = outputMap.get(item.name);
        if (itemIODetails) {
            itemIODetails.outputting.push({ ...item });
        } else {
            outputMap.set(item.name, { demanding: [], outputting: [item] });
        }

        item.optionalOutputs?.forEach((optionalOutput) => {
            const optionalOutputIODetails = outputMap.get(optionalOutput.name);
            if (optionalOutputIODetails) {
                optionalOutputIODetails.outputting.push({
                    createTime: item.createTime,
                    maximumTool: item.maximumTool,
                    output: optionalOutput.amount,
                    likelihood: optionalOutput.likelihood,
                });
            } else {
                outputMap.set(optionalOutput.name, {
                    demanding: [],
                    outputting: [
                        {
                            createTime: item.createTime,
                            maximumTool: item.maximumTool,
                            output: optionalOutput.amount,
                            likelihood: optionalOutput.likelihood,
                        },
                    ],
                });
            }
        });

        for (const demand of item.requires) {
            const requirementIODetails = outputMap.get(demand.name);
            if (requirementIODetails) {
                requirementIODetails.demanding.push({
                    ...item,
                    requiredAmount: demand.amount,
                });
            } else {
                outputMap.set(demand.name, {
                    demanding: [{ ...item, requiredAmount: demand.amount }],
                    outputting: [],
                });
            }
        }
    }

    return outputMap;
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

    const ioMap = convertItemsToIOMap(requirements);
    for (const [itemName, itemIOs] of Array.from(ioMap)) {
        if (!availableItems.has(itemName)) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        objectiveVariables.push({ name: itemName, coef: 1 });
        const overallDemandConstraint: Constraint = {
            name: `${itemName}-overall-demand`,
            vars: [],
            bnds: { type: glpk.GLP_LO, lb: 0, ub: 0 },
        };

        let totalOutputItemCoef = 0;
        for (const outputtingItem of itemIOs.outputting) {
            const outputtingItemCreateTime = calculateCreateTime(
                outputtingItem,
                maxAvailableTool
            );

            totalOutputItemCoef +=
                (outputtingItem.output / outputtingItemCreateTime) *
                (outputtingItem.likelihood ?? 1);
        }

        overallDemandConstraint.vars.push({
            name: itemName,
            coef: totalOutputItemCoef,
        });

        for (const demandingItem of itemIOs.demanding) {
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
