import type { Item, QueryItemArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryItem } from "./domain/query-item";
import { QueryFilters } from "./interfaces/query-item-primary-port";

const handler: GraphQLEventHandler<QueryItemArgs, Item[]> = async (event) => {
    const filters: QueryFilters | undefined = event.arguments.filters
        ? {
              name: event.arguments.filters.name ?? undefined,
              minimumCreators:
                  event.arguments.filters.minimumCreators ?? undefined,
              creator: event.arguments.filters.creator ?? undefined,
          }
        : undefined;

    try {
        return await queryItem(filters);
    } catch {
        throw new Error(
            "An error occurred while fetching item details, please try again."
        );
    }
};

export { handler };
