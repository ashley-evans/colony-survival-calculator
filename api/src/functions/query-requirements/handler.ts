import { AvailableToolsSchemaMap, OutputUnit } from "../../common";
import type {
    QueryRequirementArgs,
    RequirementResult,
} from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import {
    INVALID_ITEM_NAME_ERROR,
    INVALID_WORKERS_ERROR,
    UNKNOWN_ITEM_ERROR,
    TOOL_LEVEL_ERROR_PREFIX,
    MULTIPLE_OVERRIDE_ERROR_PREFIX,
    INVALID_OVERRIDE_ITEM_NOT_CREATABLE_ERROR,
    INVALID_TARGET_ERROR,
} from "./domain/errors";
import { queryRequirements } from "./domain/query-requirements";

const INVALID_OUTPUT_UNIT_ARGUMENT_ERROR =
    "Invalid arguments: Must provide output unit when querying amounts";
const INVALID_TARGET_ARGUMENT_ERROR =
    "Invalid arguments: Must provide either amount or workers when querying requirements (not both)";

const amountFields = new Set([
    "amount",
    "creators/amount",
    "creators/demands/amount",
]);

const exactUserErrors = new Set([
    INVALID_ITEM_NAME_ERROR,
    INVALID_WORKERS_ERROR,
    INVALID_TARGET_ERROR,
    UNKNOWN_ITEM_ERROR,
    INVALID_OVERRIDE_ITEM_NOT_CREATABLE_ERROR,
]);

const isUserError = ({ message }: Error): boolean => {
    return (
        exactUserErrors.has(message) ||
        message.startsWith(MULTIPLE_OVERRIDE_ERROR_PREFIX) ||
        message.startsWith(TOOL_LEVEL_ERROR_PREFIX)
    );
};

const isDefined = <T>(input: T | undefined | null): input is T => {
    return input !== undefined && input !== null;
};

const validateTargetInput = ({
    workers,
    amount,
}: Pick<QueryRequirementArgs, "workers" | "amount">):
    | { amount: number }
    | { workers: number } => {
    const isTargetWorkersDefined = isDefined(workers);
    const isTargetAmountDefined = isDefined(amount);
    if (isTargetWorkersDefined && isTargetAmountDefined) {
        throw new Error(INVALID_TARGET_ARGUMENT_ERROR);
    }

    if (isTargetWorkersDefined) {
        return { workers };
    }

    if (isTargetAmountDefined) {
        return { amount };
    }

    throw new Error(INVALID_TARGET_ARGUMENT_ERROR);
};

const handler: GraphQLEventHandler<
    QueryRequirementArgs,
    RequirementResult
> = async (event) => {
    const {
        name,
        unit,
        maxAvailableTool,
        creatorOverrides,
        hasMachineTools,
        ...targetInputs
    } = event.arguments;
    const { selectionSetList } = event.info;

    const selectedAmountFields = selectionSetList.filter((value) =>
        amountFields.has(value)
    );

    if (selectedAmountFields.length > 0 && !unit) {
        throw new Error(INVALID_OUTPUT_UNIT_ARGUMENT_ERROR);
    }

    const validatedTarget = validateTargetInput(targetInputs);

    try {
        const requirements = await queryRequirements({
            name,
            ...validatedTarget,
            ...(unit ? { unit: OutputUnit[unit] } : {}),
            ...(maxAvailableTool
                ? {
                      maxAvailableTool:
                          AvailableToolsSchemaMap[maxAvailableTool],
                  }
                : {}),
            ...(hasMachineTools !== null && hasMachineTools !== undefined
                ? { hasMachineTools }
                : {}),
            ...(creatorOverrides ? { creatorOverrides } : {}),
        });

        return {
            __typename: "Requirements",
            requirements,
        };
    } catch (ex) {
        if (ex instanceof Error && isUserError(ex)) {
            return { __typename: "UserError", message: ex.message };
        }

        throw ex;
    }
};

export { handler };
