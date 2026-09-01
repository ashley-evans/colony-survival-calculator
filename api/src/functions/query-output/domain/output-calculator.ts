import {
    isAvailableToolSufficient,
    OutputUnit,
    OutputUnitSecondMappings,
    calculateOutput as calculateItemOutput,
    getMinimumToolRequired,
    resolveAvailableTools,
    ErrorCode,
    UserError,
    ERROR_MESSAGE_MAPPING,
} from "../../../common";
import { AvailableTools, DefaultToolset } from "../../../types";
import { queryOutputDetails } from "../adapters/mongodb-output-adapter";
import { ItemOutputDetails } from "../interfaces/output-database-port";
import type { QueryOutputPrimaryPort } from "../interfaces/query-output-primary-port";

async function getItemOutputDetails(
    id: string,
    creatorID?: string,
): Promise<ItemOutputDetails[]> {
    try {
        return await queryOutputDetails({
            id,
            ...(creatorID ? { creatorID } : {}),
        });
    } catch {
        throw new Error(ERROR_MESSAGE_MAPPING[ErrorCode.INTERNAL_SERVER_ERROR]);
    }
}

function filterCreatableItems(
    items: ItemOutputDetails[],
    availableTools: AvailableTools,
): ItemOutputDetails[] {
    return items.filter((item) =>
        isAvailableToolSufficient({
            available: availableTools,
            item,
        }),
    );
}

function getMaxOutput(
    items: ItemOutputDetails[],
    workers: number,
    unit: OutputUnit,
    availableTools: AvailableTools,
): number {
    let maximumOutputPerSecond = 0;
    for (const item of items) {
        const outputPerSecond = calculateItemOutput(item, availableTools);
        if (maximumOutputPerSecond < outputPerSecond) {
            maximumOutputPerSecond = outputPerSecond;
        }
    }

    const outputPerWorker =
        OutputUnitSecondMappings[unit] * maximumOutputPerSecond;
    return outputPerWorker * workers;
}

const calculateOutput: QueryOutputPrimaryPort = async ({
    id,
    workers,
    unit,
    availableTools: providedAvailableTools,
    creatorID,
}) => {
    const availableTools = resolveAvailableTools(providedAvailableTools, {
        default: "none" as DefaultToolset,
        machine: false,
        eyeglasses: false,
    });

    if (id === "") {
        throw new UserError(ErrorCode.INVALID_ITEM_ID);
    }

    if (workers <= 0) {
        throw new UserError(ErrorCode.INVALID_WORKERS);
    }

    const outputDetails = await getItemOutputDetails(id, creatorID);
    if (outputDetails.length === 0) {
        throw new UserError(ErrorCode.UNKNOWN_ITEM);
    }

    const creatableRecipes = filterCreatableItems(
        outputDetails,
        availableTools,
    );
    if (creatableRecipes.length === 0) {
        const { needsMachineTools, needsEyeglasses, minimumDefault } =
            getMinimumToolRequired(
                outputDetails.map((details) => ({ ...details, id })),
            );

        throw new UserError(ErrorCode.TOOL_LEVEL, {
            requiredTool: needsEyeglasses
                ? "eyeglasses"
                : needsMachineTools
                  ? "machine"
                  : minimumDefault,
        });
    }

    return getMaxOutput(creatableRecipes, workers, unit, availableTools);
};

export { calculateOutput };
