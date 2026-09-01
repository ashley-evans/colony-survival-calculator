import type { OutputResult, QueryOutputArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { calculateOutput } from "./domain/output-calculator";
import { mapAvailableTools, OutputUnit, UserError } from "../../common";

const handler: GraphQLEventHandler<QueryOutputArgs, OutputResult> = async (
    event,
) => {
    const { input } = event.arguments;

    try {
        const output = await calculateOutput({
            id: input.id,
            workers: input.workers,
            unit: OutputUnit[input.unit],
            ...(input.availableTools
                ? { availableTools: mapAvailableTools(input.availableTools) }
                : {}),
            ...(input.creatorID ? { creatorID: input.creatorID } : {}),
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
