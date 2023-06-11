import {
    ToolModifierValues,
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";
import { Tools } from "../../../types";
import { queryOutputDetails } from "../adapters/mongodb-output-adapter";
import { ItemOutputDetails } from "../interfaces/output-database-port";
import type {
    OutputUnit,
    QueryOutputPrimaryPort,
} from "../interfaces/query-output-primary-port";
import OutputUnitSecondMappings from "../utils/OutputUnitSecondMapping";

const INVALID_ITEM_NAME_ERROR =
    "Invalid item name provided, must be a non-empty string";
const INVALID_WORKERS_ERROR =
    "Invalid number of workers provided, must be a positive number";
const UNKNOWN_ITEM_ERROR = "Unknown item provided";
const TOOL_LEVEL_ERROR_PREFIX =
    "Unable to create item with available tools, minimum tool is:";
const INTERNAL_SERVER_ERROR = "Internal server error";

async function getItemOutputDetails(
    name: string
): Promise<ItemOutputDetails[]> {
    try {
        return await queryOutputDetails(name);
    } catch {
        throw new Error(INTERNAL_SERVER_ERROR);
    }
}

function filterCreatableItems(
    items: ItemOutputDetails[],
    maxAvailableTool: Tools
): ItemOutputDetails[] {
    return items.filter(({ minimumTool }) =>
        isAvailableToolSufficient(minimumTool, maxAvailableTool)
    );
}

function getMinimumToolRequired(items: ItemOutputDetails[]): Tools {
    let minimum = Tools.steel;
    for (const item of items) {
        if (
            ToolModifierValues[item.minimumTool] < ToolModifierValues[minimum]
        ) {
            minimum = item.minimumTool;
        }
    }

    return minimum;
}

function getMaxOutput(
    items: ItemOutputDetails[],
    workers: number,
    unit: OutputUnit,
    maxAvailableTool: Tools
): number {
    let maximumOutputPerSecond = 0;
    for (const item of items) {
        const toolModifier = getMaxToolModifier(
            item.maximumTool,
            maxAvailableTool
        );

        const outputPerSecond = item.output / (item.createTime / toolModifier);
        if (maximumOutputPerSecond < outputPerSecond) {
            maximumOutputPerSecond = outputPerSecond;
        }
    }

    const outputPerWorker =
        OutputUnitSecondMappings[unit] * maximumOutputPerSecond;
    return outputPerWorker * workers;
}

const calculateOutput: QueryOutputPrimaryPort = async (
    name,
    workers,
    unit,
    maxAvailableTool = Tools.none
) => {
    if (name === "") {
        throw new Error(INVALID_ITEM_NAME_ERROR);
    }

    if (workers <= 0) {
        throw new Error(INVALID_WORKERS_ERROR);
    }

    const outputDetails = await getItemOutputDetails(name);
    if (outputDetails.length === 0) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    const creatableRecipes = filterCreatableItems(
        outputDetails,
        maxAvailableTool
    );
    if (creatableRecipes.length === 0) {
        const minimumTool = getMinimumToolRequired(outputDetails);
        throw new Error(`${TOOL_LEVEL_ERROR_PREFIX} ${minimumTool}`);
    }

    return getMaxOutput(creatableRecipes, workers, unit, maxAvailableTool);
};

export { calculateOutput };
