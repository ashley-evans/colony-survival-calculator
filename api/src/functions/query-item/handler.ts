import type { Item } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryItem } from "./domain/query-item";

const handler: GraphQLEventHandler<void, Item[]> = async () => {
    return queryItem();
};

export { handler };
