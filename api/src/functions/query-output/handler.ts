import type { QueryOutputArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { calculateOutput } from "./domain/output-calculator";
import { OutputUnit } from "./interfaces/query-output-primary-port";
import { ToolSchemaMap } from "../../common/modifiers";

const handler: GraphQLEventHandler<QueryOutputArgs, number> = async (event) => {
    const { name, workers, unit, maxAvailableTool } = event.arguments;

    return calculateOutput(
        name,
        workers,
        OutputUnit[unit],
        maxAvailableTool ? ToolSchemaMap[maxAvailableTool] : undefined
    );
};

export { handler };
