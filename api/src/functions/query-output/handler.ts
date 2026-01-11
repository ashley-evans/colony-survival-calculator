import type { OutputResult, QueryOutputArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { calculateOutput } from "./domain/output-calculator";
import { AvailableToolsSchemaMap, OutputUnit } from "../../common";
import { UserError } from "../../common";

const handler: GraphQLEventHandler<QueryOutputArgs, OutputResult> = async (
    event,
) => {
    const { id, workers, unit, maxAvailableTool, creatorID, hasMachineTools } =
        event.arguments;

    try {
        const output = await calculateOutput({
            id,
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
            ...(creatorID ? { creatorID } : {}),
        });

        return { __typename: "OptimalOutput", amount: output };
    } catch (ex) {
        if (ex instanceof UserError) {
            return {
                __typename: "UserError",
                code: ex.code,
                details: ex.details ? JSON.stringify(ex.details) : null,
            };
        }

        throw ex;
    }
};

export { handler };
