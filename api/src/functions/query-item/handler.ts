import {
    GraphQLToolsSchemaMap,
    AvailableToolsSchemaMap,
} from "../../common/modifiers";
import type { Item, QueryItemArgs, OptimalFilter } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryItem } from "./domain/query-item";
import {
    OptimalFilter as DomainOptimalFilter,
    QueryFilters,
} from "./interfaces/query-item-primary-port";

function mapOptimalFilter(
    input?: OptimalFilter | null
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
          }
        : undefined;
}

const handler: GraphQLEventHandler<QueryItemArgs, Item[]> = async (event) => {
    const { name, minimumCreators, creator, optimal } =
        event.arguments.filters ?? {};

    const optimalFilter = mapOptimalFilter(optimal);
    const filters: QueryFilters | undefined = event.arguments.filters
        ? {
              name: name ?? undefined,
              minimumCreators: minimumCreators ?? undefined,
              creator: creator ?? undefined,
              optimal: optimalFilter,
          }
        : undefined;

    try {
        const items = await queryItem(filters);
        return items.map(({ toolset, ...rest }) => ({
            maximumTool: GraphQLToolsSchemaMap[toolset.maximumTool],
            minimumTool: GraphQLToolsSchemaMap[toolset.minimumTool],
            ...rest,
        }));
    } catch (ex) {
        throw new Error(
            "An error occurred while fetching item details, please try again."
        );
    }
};

export { handler };
