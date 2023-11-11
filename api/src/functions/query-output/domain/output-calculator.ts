import {
    isAvailableToolSufficient,
    OutputUnit,
    OutputUnitSecondMappings,
    calculateOutput as calculateItemOutput,
    getMinimumToolRequired,
    MinimumTools,
} from "../../../common";
import { DefaultToolset, GlassesToolset } from "../../../types";
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
    maxAvailableTool: DefaultToolset,
    hasMachineTools: boolean,
    hasEyeglasses: boolean
): ItemOutputDetails[] {
    return items.filter((item) =>
        isAvailableToolSufficient(
            maxAvailableTool,
            hasMachineTools,
            hasEyeglasses,
            item
        )
    );
}

function getMaxOutput(
    items: ItemOutputDetails[],
    workers: number,
    unit: OutputUnit,
    maxAvailableDefaultTool: DefaultToolset,
    maxAvailableEyeglasses: GlassesToolset
): number {
    let maximumOutputPerSecond = 0;
    for (const item of items) {
        const outputPerSecond = calculateItemOutput(
            item,
            maxAvailableDefaultTool,
            maxAvailableEyeglasses
        );

        if (maximumOutputPerSecond < outputPerSecond) {
            maximumOutputPerSecond = outputPerSecond;
        }
    }

    const outputPerWorker =
        OutputUnitSecondMappings[unit] * maximumOutputPerSecond;
    return outputPerWorker * workers;
}

function getMinimumToolError({
    needsMachineTools,
    minimumDefault,
}: MinimumTools): string {
    if (minimumDefault !== DefaultToolset.none) {
        return `${TOOL_LEVEL_ERROR_PREFIX} minimum tool is: ${minimumDefault}`;
    }

    if (needsMachineTools) {
        return `${TOOL_LEVEL_ERROR_PREFIX} requires machine tools`;
    }

    return `${TOOL_LEVEL_ERROR_PREFIX} requires eyeglasses`;
}

const calculateOutput: QueryOutputPrimaryPort = async ({
    name,
    workers,
    unit,
    maxAvailableTool = DefaultToolset.none,
    hasMachineTools = false,
    hasEyeglasses = false,
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
        maxAvailableTool,
        hasMachineTools,
        hasEyeglasses
    );
    if (creatableRecipes.length === 0) {
        const minimumTool = getMinimumToolRequired(
            outputDetails.map((details) => ({ ...details, name }))
        );
        const error = getMinimumToolError(minimumTool);
        throw new Error(error);
    }

    const maxAvailableEyeglasses = hasEyeglasses
        ? GlassesToolset.glasses
        : GlassesToolset.no_glasses;

    return getMaxOutput(
        creatableRecipes,
        workers,
        unit,
        maxAvailableTool,
        maxAvailableEyeglasses
    );
};

export { calculateOutput };
