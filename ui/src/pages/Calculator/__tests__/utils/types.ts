import { Item } from "../../../../graphql/__generated__/graphql";

type ItemName = Pick<Item, "id" | "name">;

export type { ItemName };
