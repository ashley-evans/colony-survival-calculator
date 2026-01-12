import { GraphQLToolsSchemaMap, AvailableToolsSchemaMap } from "../../common";
import type { Item, QueryItemArgs, OptimalFilter } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryItem } from "./domain/query-item";
import {
    OptimalFilter as DomainOptimalFilter,
    QueryFilters,
} from "./interfaces/query-item-primary-port";

function mapOptimalFilter(
    input?: OptimalFilter | null,
): DomainOptimalFilter | undefined {
    return input
        ? {
              maxAvailableTool: input.maxAvailableTool
                  ? AvailableToolsSchemaMap[input.maxAvailableTool]
                  : undefined,
              hasMachineTools:
                  input.hasMachineTools !== null &&
                  input.hasMachineTools !== undefined
                      ? input.hasMachineTools
                      : undefined,
              hasEyeglasses:
                  input.hasEyeglasses !== null &&
                  input.hasEyeglasses !== undefined
                      ? input.hasEyeglasses
                      : undefined,
          }
        : undefined;
}

const handler: GraphQLEventHandler<QueryItemArgs, Item[]> = async (event) => {
    const { id, minimumCreators, creatorID, optimal } =
        event.arguments.filters ?? {};
    const locale = event.arguments.locale ?? undefined;

    const optimalFilter = mapOptimalFilter(optimal);
    const filters: QueryFilters | undefined = event.arguments.filters
        ? {
              id: id ?? undefined,
              minimumCreators: minimumCreators ?? undefined,
              creatorID: creatorID ?? undefined,
              optimal: optimalFilter,
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
