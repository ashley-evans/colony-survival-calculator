import { GLPK, LP } from "glpk.js";

import { Item, Items, OptionalOutput, Tools } from "../../../types";
import { INTERNAL_SERVER_ERROR, UNKNOWN_ITEM_ERROR } from "./errors";
import { calculateCreateTime } from "./item-utils";

type Constraint = LP["subjectTo"][number];
type ObjectiveVariable = LP["objective"]["vars"][number];
type DemandingItemDetails = Omit<Item, "requires"> & { requiredAmount: number };
type OutputDetails = Pick<Item, "output" | "createTime" | "maximumTool"> &
    Partial<Pick<OptionalOutput, "likelihood">>;
type IOItemDetails = {
    demanding: DemandingItemDetails[];
    outputting: OutputDetails[];
};

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

function createRequirementsLinearProgram(
    glpk: GLPK,
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

export { createRequirementsLinearProgram };
