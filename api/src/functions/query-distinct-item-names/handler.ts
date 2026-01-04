import { ItemName, QueryDistinctItemNamesArgs } from "../../graphql/schema";
import { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryDistinctItemNames } from "./domain/query-distinct-item-names";

const handler: GraphQLEventHandler<
    QueryDistinctItemNamesArgs,
    ItemName[]
> = async (event) => {
    return await queryDistinctItemNames(event.arguments.locale ?? undefined);
};

export { handler };
