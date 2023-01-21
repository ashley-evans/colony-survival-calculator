import { Items, Item as GeneratedItem } from "./generated/items";

type OmitSchema<T> = Omit<T, "$schema">;

type Item = OmitSchema<GeneratedItem>;

export type { Items, Item };
