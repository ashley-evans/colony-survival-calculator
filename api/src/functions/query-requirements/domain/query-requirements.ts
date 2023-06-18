import GLPK, { Result } from "glpk.js";

import type {
    CreatorOverride,
    QueryRequirementsPrimaryPort,
} from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import { Items, Tools } from "../../../types";
import { isAvailableToolSufficient } from "../../../common/modifiers";
import { RequiredWorkers } from "../interfaces/query-requirements-primary-port";
import { createRequirementsLinearProgram } from "./requirements-linear-program";
import {
    INTERNAL_SERVER_ERROR,
    INVALID_ITEM_NAME_ERROR,
    INVALID_OVERRIDE_ITEM_NOT_CREATABLE_ERROR,
    INVALID_WORKERS_ERROR,
    MULTIPLE_OVERRIDE_ERROR_PREFIX,
    TOOL_LEVEL_ERROR_PREFIX,
    UNKNOWN_ITEM_ERROR,
} from "./errors";
import {
    canCreateItem,
    filterByCreatorOverrides,
    filterByMinimumTool,
    filterByOptimal,
    getLowestRequiredTool,
} from "./item-utils";

const glpk = GLPK();

type ResultVariables = Result["result"]["vars"];

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

function mapResults(
    inputItemName: string,
    results: ResultVariables
): RequiredWorkers[] {
    const requiredWorkers: RequiredWorkers[] = [];
    for (const [itemName, workers] of Object.entries(results)) {
        if (itemName != inputItemName && workers !== 0) {
            requiredWorkers.push({ name: itemName, workers });
        }
    }

    return requiredWorkers;
}

const queryRequirements: QueryRequirementsPrimaryPort = async ({
    name,
    workers,
    maxAvailableTool = Tools.none,
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

    const lowestToolRequired = getLowestRequiredTool(
        filterByMinimumTool(overriddenRequirements)
    );
    if (!isAvailableToolSufficient(lowestToolRequired, maxAvailableTool)) {
        throw new Error(`${TOOL_LEVEL_ERROR_PREFIX} ${lowestToolRequired}`);
    }

    const optimalRequirements = filterByOptimal(
        overriddenRequirements,
        maxAvailableTool
    );

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
