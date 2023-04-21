import { Tools } from "../../../types";
import { queryOutputDetails } from "../adapters/mongodb-output-adapter";
import type { ItemOutputDetails } from "../interfaces/output-database-port";
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

const defaultModififer = 1;
const toolValues = new Map<Tools, number>([
    [Tools.none, defaultModififer],
    [Tools.stone, 2],
    [Tools.copper, 4],
    [Tools.iron, 5.3],
    [Tools.bronze, 6.15],
    [Tools.steel, 8],
]);

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

function isAvailableToolSufficient(minimum: Tools, available: Tools): boolean {
    const minimumToolModifier = toolValues.get(minimum);
    const availableToolModifier = toolValues.get(available);
    if (!minimumToolModifier || !availableToolModifier) {
        throw new Error(INTERNAL_SERVER_ERROR);
    }

    return availableToolModifier >= minimumToolModifier;
}

function getMaxToolModifier(available: Tools): number {
    const availableToolModifier = toolValues.get(available);
    if (!availableToolModifier) {
        throw new Error(INTERNAL_SERVER_ERROR);
    }

    return availableToolModifier;
}

function calculateOptimalOutput(
    outputPerCreate: number,
    createTime: number,
    workers: number,
    unit: OutputUnit,
    toolModifier: number = defaultModififer
): number {
    const outputPerSecond = outputPerCreate / (createTime / toolModifier);
    const outputPerWorker = OutputUnitSecondMappings[unit] * outputPerSecond;
    return outputPerWorker * workers;
}

const calculateOutput: QueryOutputPrimaryPort = async (
    name,
    workers,
    unit,
    maxAvailableTool
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

    if (maxAvailableTool) {
        if (
            !isAvailableToolSufficient(
                outputDetails.minimumTool,
                maxAvailableTool
            )
        ) {
            throw new Error(
                `${TOOL_LEVEL_ERROR_PREFIX} ${outputDetails.minimumTool}`
            );
        }

        const toolModifier = getMaxToolModifier(maxAvailableTool);
        return calculateOptimalOutput(
            outputDetails.output,
            outputDetails.createTime,
            workers,
            unit,
            toolModifier
        );
    }

    return calculateOptimalOutput(
        outputDetails.output,
        outputDetails.createTime,
        workers,
        unit
    );
};

export { calculateOutput };
