import { ToolSchemaMap } from "../../common/modifiers";
import type { QueryRequirementArgs, Requirement } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryRequirements } from "./domain/query-requirements";

const handler: GraphQLEventHandler<
    QueryRequirementArgs,
    Requirement[]
> = async (event) => {
    const { name, workers, maxAvailableTool, creatorOverrides } =
        event.arguments;

    return await queryRequirements({
        name,
        workers,
        ...(maxAvailableTool
            ? { maxAvailableTool: ToolSchemaMap[maxAvailableTool] }
            : {}),
        ...(creatorOverrides ? { creatorOverrides } : {}),
    });
};

export { handler };
