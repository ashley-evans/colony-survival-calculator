import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import type { Item, ItemInput } from "../../graphql/schema";

const handler: GraphQLEventHandler<ItemInput, Item> = async (event) => {
    console.dir(event);
    return {
        id: event.arguments.name,
    };
};

export { handler };
