import {
    ToolModifierValues,
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";
import { OutputUnit, OutputUnitSecondMappings } from "../../../common/output";
import { DefaultToolset } from "../../../types";
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
    maxAvailableTool: DefaultToolset
): ItemOutputDetails[] {
    return items.filter(({ toolset }) =>
        isAvailableToolSufficient(toolset.minimumTool, maxAvailableTool)
    );
}

function getMinimumToolRequired(items: ItemOutputDetails[]): DefaultToolset {
    let minimum = DefaultToolset.steel;
    for (const { toolset } of items) {
        if (
            ToolModifierValues[toolset.minimumTool] <
            ToolModifierValues[minimum]
        ) {
            minimum = toolset.minimumTool;
        }
    }

    return minimum;
}

function getMaxOutput(
    items: ItemOutputDetails[],
    workers: number,
    unit: OutputUnit,
    maxAvailableTool: DefaultToolset
): number {
    let maximumOutputPerSecond = 0;
    for (const { output, createTime, toolset } of items) {
        const toolModifier = getMaxToolModifier(
            toolset.maximumTool,
            maxAvailableTool
        );

        const outputPerSecond = output / (createTime / toolModifier);
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
    maxAvailableTool = DefaultToolset.none,
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
