import {
    ToolModifierValues,
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";
import { OutputUnit, OutputUnitSecondMappings } from "../../../common/output";
import { Tools } from "../../../types";
import { queryOutputDetails } from "../adapters/mongodb-output-adapter";
import { ItemOutputDetails } from "../interfaces/output-database-port";
import type { QueryOutputPrimaryPort } from "../interfaces/query-output-primary-port";
import {
    INTERNAL_SERVER_ERROR,
    INVALID_ITEM_NAME_ERROR,
    INVALID_WORKERS_ERROR,
    UNKNOWN_ITEM_ERROR,
    TOOL_LEVEL_ERROR_PREFIX,
} from "./errors";

async function getItemOutputDetails(
    name: string,
    creator?: string
): Promise<ItemOutputDetails[]> {
    try {
        return await queryOutputDetails({
            name,
            ...(creator ? { creator } : {}),
        });
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

const calculateOutput: QueryOutputPrimaryPort = async ({
    name,
    workers,
    unit,
    maxAvailableTool = Tools.none,
    creator,
}) => {
    if (name === "") {
        throw new Error(INVALID_ITEM_NAME_ERROR);
    }

    if (workers <= 0) {
        throw new Error(INVALID_WORKERS_ERROR);
    }

    const outputDetails = await getItemOutputDetails(name, creator);
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
