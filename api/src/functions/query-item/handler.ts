import type { Item } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryItem } from "./domain/query-item";

const handler: GraphQLEventHandler<void, Item[]> = async () => {
    try {
        return await queryItem();
    } catch {
        throw new Error(
            "An error occurred while fetching item details, please try again."
        );
    }
};

export { handler };
