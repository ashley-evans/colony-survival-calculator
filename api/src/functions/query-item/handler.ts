import { ToolSchemaMap } from "../../common/modifiers";
import type { Item, QueryItemArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryItem } from "./domain/query-item";
import {
    OptimalFilter,
    QueryFilters,
} from "./interfaces/query-item-primary-port";
const handler: GraphQLEventHandler<QueryItemArgs, Item[]> = async (event) => {
    const { name, minimumCreators, creator, optimal } =
        event.arguments.filters ?? {};

    const optimalFilter: OptimalFilter | undefined = optimal
        ? {
              maxAvailableTool: optimal.maxAvailableTool
                  ? ToolSchemaMap[optimal.maxAvailableTool]
                  : undefined,
          }
        : undefined;

    const filters: QueryFilters | undefined = event.arguments.filters
        ? {
              name: name ?? undefined,
              minimumCreators: minimumCreators ?? undefined,
              creator: creator ?? undefined,
              optimal: optimalFilter,
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
