import GLPK, { Result } from "glpk.js";

import type { QueryRequirementsPrimaryPort } from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import { Items, Tools } from "../../../types";
import { isAvailableToolSufficient } from "../../../common/modifiers";
import { RequiredWorkers } from "../interfaces/query-requirements-primary-port";
import { createRequirementsLinearProgram } from "./requirements-linear-program";
import {
    INTERNAL_SERVER_ERROR,
    INVALID_ITEM_NAME_ERROR,
    INVALID_WORKERS_ERROR,
    TOOL_LEVEL_ERROR_PREFIX,
    UNKNOWN_ITEM_ERROR,
} from "./errors";
import {
    filterByMinimumTool,
    filterByOptimal,
    getLowestRequiredTool,
} from "./item-utils";

const glpk = GLPK();

type ResultVariables = Result["result"]["vars"];

async function getRequiredItemDetails(name: string): Promise<Items> {
    try {
        return await queryRequirementsDB(name);
    } catch {
        throw new Error(INTERNAL_SERVER_ERROR);
    }
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

const queryRequirements: QueryRequirementsPrimaryPort = async ({
    name,
    workers,
    maxAvailableTool = Tools.none,
}) => {
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

    const lowestToolRequired = getLowestRequiredTool(
        filterByMinimumTool(requirements)
    );
    if (!isAvailableToolSufficient(lowestToolRequired, maxAvailableTool)) {
        throw new Error(`${TOOL_LEVEL_ERROR_PREFIX} ${lowestToolRequired}`);
    }

    const optimalRequirements = filterByOptimal(requirements, maxAvailableTool);
    const program = createRequirementsLinearProgram(
        glpk,
        name,
        workers,
        optimalRequirements,
        maxAvailableTool
    );

    const output = glpk.solve(program);
    return mapResults(name, output.result.vars);
};

export { queryRequirements };
