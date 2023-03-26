import type { QueryRequirementArgs, Requirement } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryRequirements } from "./domain/query-requirements";

const handler: GraphQLEventHandler<
    QueryRequirementArgs,
    Requirement[]
> = async (event) => {
    const { name, amount } = event.arguments;

    try {
        return await queryRequirements(name, amount);
    } catch {
        throw new Error(
            "An error occurred while fetching item requirements, please try again."
        );
    }
};

export { handler };
