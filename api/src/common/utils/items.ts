import { Item } from "../../types";

function groupItemsByName<T extends Pick<Item, "name">>(
    items: readonly T[],
): Map<T["name"], T[]> {
    const itemTools = new Map<string, T[]>();
    for (const item of items) {
        const recipes = itemTools.get(item.name) ?? [];
        itemTools.set(item.name, [...recipes, item]);
    }

    return itemTools;
}

export { groupItemsByName };
