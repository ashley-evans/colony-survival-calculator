export type Item = { name: string };

function createItem(itemName: string): Item {
    return { name: itemName };
}

function itemToKey(item: Item, index: number): string {
    return `${item.name}-${index}`;
}

function itemToDisplayText(item: Item): string {
    return item.name;
}

export { createItem, itemToKey, itemToDisplayText };
