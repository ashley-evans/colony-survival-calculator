import { GraphQLToolsSchemaMap, mapAvailableTools } from "../../common";
import type { Item, QueryItemArgs } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryItem } from "./domain/query-item";
import type { QueryFilters } from "./interfaces/query-item-primary-port";

const handler: GraphQLEventHandler<QueryItemArgs, Item[]> = async (event) => {
    const { id, minimumCreators, creatorID, optimal } =
        event.arguments.filters ?? {};
    const locale = event.arguments.locale ?? undefined;

    const filters: QueryFilters | undefined = event.arguments.filters
        ? {
              id: id ?? undefined,
              minimumCreators: minimumCreators ?? undefined,
              creatorID: creatorID ?? undefined,
              optimal: optimal ? mapAvailableTools(optimal) : undefined,
          }
        : undefined;

    try {
        const items = await queryItem(filters, locale);
        return items.map(({ toolset, ...rest }) => ({
            __typename: "Item",
            maximumTool: GraphQLToolsSchemaMap[toolset.maximumTool],
            minimumTool: GraphQLToolsSchemaMap[toolset.minimumTool],
            ...rest,
        }));
    } catch {
        throw new Error(
            "An error occurred while fetching item details, please try again.",
        );
    }
};

export { handler };
