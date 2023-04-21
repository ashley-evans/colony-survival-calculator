import type { QueryRequirementsPrimaryPort } from "../interfaces/query-requirements-primary-port";
import { queryRequirements as queryRequirementsDB } from "../adapters/mongodb-requirements-adapter";
import { Item, Items, Tools } from "../../../types";
import {
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";

const INVALID_ITEM_NAME_ERROR =
    "Invalid item name provided, must be a non-empty string";
const INVALID_WORKERS_ERROR =
    "Invalid number of workers provided, must be a positive number";
const UNKNOWN_ITEM_ERROR = "Unknown item provided";
const TOOL_LEVEL_ERROR_PREFIX =
    "Unable to create item with available tools, minimum tool is:";
const INTERNAL_SERVER_ERROR = "Internal server error";

function calculateRequirements(
    inputItem: Item,
    inputDesiredWorkers: number,
    knownItems: Map<string, Item>,
    maxAvailableTool: Tools,
    results: Map<string, number>
) {
    const inputItemModifier = getMaxToolModifier(
        inputItem.maximumTool,
        maxAvailableTool
    );
    const inputItemModifiedCreateTime =
        inputItem.createTime / inputItemModifier;

    for (const requirement of inputItem.requires) {
        const requiredItem = knownItems.get(requirement.name);
        if (!requiredItem) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        if (
            !isAvailableToolSufficient(
                requiredItem.minimumTool,
                maxAvailableTool
            )
        ) {
            throw new Error(
                `${TOOL_LEVEL_ERROR_PREFIX} ${requiredItem.minimumTool}`
            );
        }

        const requiredItemModifier = getMaxToolModifier(
            requiredItem.maximumTool,
            maxAvailableTool
        );

        const requiredPerSecond =
            requirement.amount / inputItemModifiedCreateTime;
        const producedPerSecond =
            requiredItem.output /
            (requiredItem.createTime / requiredItemModifier);
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
                maxAvailableTool,
                results
            );
        }
    }
}

async function getRequiredItemDetails(name: string): Promise<Items> {
    try {
        return await queryRequirementsDB(name);
    } catch {
        throw new Error(INTERNAL_SERVER_ERROR);
    }
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

    const requirementMap = new Map<string, Item>();
    for (const requirement of requirements) {
        requirementMap.set(requirement.name, requirement);
    }

    const inputItem = requirementMap.get(name);
    if (!inputItem) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    if (!isAvailableToolSufficient(inputItem.minimumTool, maxAvailableTool)) {
        throw new Error(`${TOOL_LEVEL_ERROR_PREFIX} ${inputItem.minimumTool}`);
    }

    const results = new Map<string, number>();
    calculateRequirements(
        inputItem,
        workers,
        requirementMap,
        maxAvailableTool,
        results
    );
    return Array.from(results, ([name, workers]) => ({ name, workers }));
};

export { queryRequirements };
