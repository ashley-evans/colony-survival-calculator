import { Item } from "../../../../graphql/__generated__/schema-types";

type ItemName = Pick<Item, "id" | "name">;

export type { ItemName };
