import { Item as GeneratedItem } from "./generated/item";

type OmitSchema<T> = Omit<T, "$schema">;

type Item = OmitSchema<GeneratedItem>;

export type { Item };
