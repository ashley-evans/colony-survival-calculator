import { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryDistinctItemNames } from "./domain/query-distinct-item-names";

const handler: GraphQLEventHandler<never, string[]> = async () => {
    return await queryDistinctItemNames();
};

export { handler };
