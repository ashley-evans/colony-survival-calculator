import {
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";
import { Tools } from "../../../types";
import { queryOutputDetails } from "../adapters/mongodb-output-adapter";
import type { ItemOutputDetails } from "../interfaces/output-database-port";
import type { QueryOutputPrimaryPort } from "../interfaces/query-output-primary-port";
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
): Promise<ItemOutputDetails | undefined> {
    try {
        const details = await queryOutputDetails(name);
        if (details.length > 1) {
            throw new Error();
        }

        return details[0];
    } catch {
        throw new Error(INTERNAL_SERVER_ERROR);
    }
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
    if (!outputDetails) {
        throw new Error(UNKNOWN_ITEM_ERROR);
    }

    if (
        !isAvailableToolSufficient(outputDetails.minimumTool, maxAvailableTool)
    ) {
        throw new Error(
            `${TOOL_LEVEL_ERROR_PREFIX} ${outputDetails.minimumTool}`
        );
    }

    const toolModifier = getMaxToolModifier(
        outputDetails.maximumTool,
        maxAvailableTool
    );

    const outputPerSecond =
        outputDetails.output / (outputDetails.createTime / toolModifier);
    const outputPerWorker = OutputUnitSecondMappings[unit] * outputPerSecond;
    return outputPerWorker * workers;
};

export { calculateOutput };
