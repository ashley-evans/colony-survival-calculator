import type { OutputResult, QueryOutputArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { calculateOutput } from "./domain/output-calculator";
import { AvailableToolsSchemaMap, OutputUnit } from "../../common";
import {
    INVALID_ITEM_NAME_ERROR,
    INVALID_WORKERS_ERROR,
    TOOL_LEVEL_ERROR_PREFIX,
    UNKNOWN_ITEM_ERROR,
} from "./domain/errors";

const exactUserErrors = new Set([
    INVALID_ITEM_NAME_ERROR,
    INVALID_WORKERS_ERROR,
    UNKNOWN_ITEM_ERROR,
]);

const isUserError = ({ message }: Error): boolean => {
    return (
        exactUserErrors.has(message) ||
        message.startsWith(TOOL_LEVEL_ERROR_PREFIX)
    );
};

const handler: GraphQLEventHandler<QueryOutputArgs, OutputResult> = async (
    event,
) => {
    const { name, workers, unit, maxAvailableTool, creator, hasMachineTools } =
        event.arguments;

    try {
        const output = await calculateOutput({
            name,
            workers,
            unit: OutputUnit[unit],
            ...(maxAvailableTool
                ? {
                      maxAvailableTool:
                          AvailableToolsSchemaMap[maxAvailableTool],
                  }
                : {}),
            ...(hasMachineTools !== undefined && hasMachineTools !== null
                ? { hasMachineTools }
                : {}),
            ...(creator ? { creator } : {}),
        });

        return { __typename: "OptimalOutput", amount: output };
    } catch (ex) {
        if (ex instanceof Error && isUserError(ex)) {
            return { __typename: "UserError", message: ex.message };
        }

        throw ex;
    }
};

export { handler };
