import { ToolSchemaMap } from "../../common/modifiers";
import type { QueryRequirementArgs, Requirement } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryRequirements } from "./domain/query-requirements";

const handler: GraphQLEventHandler<
    QueryRequirementArgs,
    Requirement[]
> = async (event) => {
    const { name, workers, maxAvailableTool } = event.arguments;

    return await queryRequirements(
        name,
        workers,
        maxAvailableTool ? ToolSchemaMap[maxAvailableTool] : undefined
    );
};

export { handler };
