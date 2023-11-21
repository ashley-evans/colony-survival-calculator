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
} from "./domain/errors";
import { queryRequirements } from "./domain/query-requirements";

const INVALID_ARGUMENT_ERROR =
    "Invalid arguments: Must provide output unit when querying amounts";

const amountFields = new Set([
    "amount",
    "creators/amount",
    "creators/demands/amount",
]);

const exactUserErrors = new Set([
    INVALID_ITEM_NAME_ERROR,
    INVALID_WORKERS_ERROR,
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

const handler: GraphQLEventHandler<
    QueryRequirementArgs,
    RequirementResult
> = async (event) => {
    const {
        name,
        target,
        unit,
        maxAvailableTool,
        creatorOverrides,
        hasMachineTools,
    } = event.arguments;
    const { selectionSetList } = event.info;

    const selectedAmountFields = selectionSetList.filter((value) =>
        amountFields.has(value)
    );

    if (selectedAmountFields.length > 0 && !unit) {
        throw new Error(INVALID_ARGUMENT_ERROR);
    }

    try {
        const requirements = await queryRequirements({
            name,
            ...("amount" in target
                ? { amount: target.amount }
                : { workers: target.workers }),
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
