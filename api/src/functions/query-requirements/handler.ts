import type { QueryRequirementArgs, Requirement } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryRequirements } from "./domain/query-requirements";

const handler: GraphQLEventHandler<
    QueryRequirementArgs,
    Requirement[]
> = async (event) => {
    const { name, workers } = event.arguments;

    return await queryRequirements(name, workers);
};

export { handler };
