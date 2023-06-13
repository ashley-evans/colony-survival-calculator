import type { QueryOutputArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { calculateOutput } from "./domain/output-calculator";
import { OutputUnit } from "./interfaces/query-output-primary-port";
import { ToolSchemaMap } from "../../common/modifiers";

const handler: GraphQLEventHandler<QueryOutputArgs, number> = async (event) => {
    const { name, workers, unit, maxAvailableTool, creator } = event.arguments;

    return calculateOutput({
        name,
        workers,
        unit: OutputUnit[unit],
        ...(maxAvailableTool
            ? { maxAvailableTool: ToolSchemaMap[maxAvailableTool] }
            : {}),
        ...(creator ? { creator } : {}),
    });
};

export { handler };
