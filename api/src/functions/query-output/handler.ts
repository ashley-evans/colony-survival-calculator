import type { QueryOutputArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { calculateOutput } from "./domain/output-calculator";
import { OutputUnit } from "./interfaces/query-output-primary-port";

const handler: GraphQLEventHandler<QueryOutputArgs, number> = async (event) => {
    const { name, workers, unit } = event.arguments;
    return calculateOutput(name, workers, OutputUnit[unit]);
};

export { handler };
