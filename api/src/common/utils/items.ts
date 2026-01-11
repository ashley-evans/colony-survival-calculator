import { TranslatedItem } from "../../types";

function groupItemsByID<T extends Pick<TranslatedItem, "id">>(
    items: readonly T[],
): Map<T["id"], T[]> {
    const itemTools = new Map<string, T[]>();
    for (const item of items) {
        const recipes = itemTools.get(item.id) ?? [];
        itemTools.set(item.id, [...recipes, item]);
    }

    return itemTools;
}

export { groupItemsByID };
