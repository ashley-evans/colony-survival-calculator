import { Items, Item as GeneratedItem, Requirement } from "./generated/items";

type OmitSchema<T> = Omit<T, "$schema">;

type Item = OmitSchema<GeneratedItem>;

export type { Items, Item, Requirement };
