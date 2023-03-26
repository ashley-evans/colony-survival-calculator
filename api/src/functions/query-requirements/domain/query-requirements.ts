import type { QueryRequirementsPrimaryPort } from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import type { Item } from "../../../types";

const INVALID_ITEM_NAME_ERROR =
    "Invalid item name provided, must be a non-empty string";
const INVALID_WORKERS_ERROR =
    "Invalid number of workers provided, must be a positive number";
const UNKNOWN_ITEM_ERROR = "Unknown item provided";
const INTERNAL_SERVER_ERROR = "Internal server error";

function calculateRequirements(
    inputItem: Item,
    inputDesiredWorkers: number,
    knownItems: Map<string, Item>,
    results: Map<string, number>
) {
    for (const requirement of inputItem.requires) {
        const requiredItem = knownItems.get(requirement.name);
        if (!requiredItem) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const requiredPerSecond = requirement.amount / inputItem.createTime;
        const producedPerSecond = requiredItem.output / requiredItem.createTime;
        const demandPerSecond = requiredPerSecond / producedPerSecond;
        const requiredWorkers = demandPerSecond * inputDesiredWorkers;

        const existingRequirements = results.get(requirement.name);
        results.set(
            requirement.name,
            (existingRequirements ?? 0) + requiredWorkers
        );

        if (requiredItem.requires.length > 0) {
            calculateRequirements(
                requiredItem,
                requiredWorkers,
                knownItems,
                results
            );
        }
    }
}

const queryRequirements: QueryRequirementsPrimaryPort = async (
    name: string,
    workers: number
) => {
    if (name === "") {
        throw new Error(INVALID_ITEM_NAME_ERROR);
    }

    if (workers <= 0) {
        throw new Error(INVALID_WORKERS_ERROR);
    }

    const requirements = await queryRequirementsDB(name);
    if (requirements.length == 0) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const requirementMap = new Map<string, Item>();
    for (const requirement of requirements) {
        requirementMap.set(requirement.name, requirement);
    }

    const inputItem = requirementMap.get(name);
    if (!inputItem) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const results = new Map<string, number>();
    calculateRequirements(inputItem, workers, requirementMap, results);
    return Array.from(results, ([name, workers]) => ({ name, workers }));
};

export { queryRequirements };
