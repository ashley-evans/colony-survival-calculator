import type { QueryOutputArgs, Tools } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { Tools as SchemaTools } from "../../types";
import { calculateOutput } from "./domain/output-calculator";
import { OutputUnit } from "./interfaces/query-output-primary-port";

const toolMap: Record<Tools, SchemaTools> = {
    NONE: SchemaTools.none,
    STONE: SchemaTools.stone,
    COPPER: SchemaTools.copper,
    IRON: SchemaTools.iron,
    BRONZE: SchemaTools.bronze,
    STEEL: SchemaTools.steel,
};

const handler: GraphQLEventHandler<QueryOutputArgs, number> = async (event) => {
    const { name, workers, unit, maxAvailableTool } = event.arguments;

    return calculateOutput(
        name,
        workers,
        OutputUnit[unit],
        maxAvailableTool ? toolMap[maxAvailableTool] : undefined
    );
};

export { handler };
