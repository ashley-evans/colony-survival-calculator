import dayjs from "dayjs";

import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import type { Item, ItemInput } from "../../graphql/schema";

const handler: GraphQLEventHandler<ItemInput, Item> = async (event) => {
    console.log(`The date is: ${dayjs().format()}`);
    return {
        id: event.arguments.name,
    };
};

export { handler };
