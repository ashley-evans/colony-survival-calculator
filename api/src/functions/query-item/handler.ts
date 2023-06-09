import type { Item, QueryItemArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryItem } from "./domain/query-item";

const handler: GraphQLEventHandler<QueryItemArgs, Item[]> = async (event) => {
    try {
        return await queryItem(event.arguments.filters?.name ?? undefined);
    } catch {
        throw new Error(
            "An error occurred while fetching item details, please try again."
        );
    }
};

export { handler };
