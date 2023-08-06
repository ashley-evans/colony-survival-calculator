import type { QueryOutputArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { calculateOutput } from "./domain/output-calculator";
import { ToolSchemaMap } from "../../common/modifiers";
import { OutputUnit } from "../../common/output";

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
