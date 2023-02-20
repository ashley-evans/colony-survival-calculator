import React, { FormEvent } from "react";

import { Item, Items } from "../../../../types";

type ItemSelectorProps = {
    items: Items;
    onItemChange: (item: Item) => void;
};

function ItemSelector({ items, onItemChange }: ItemSelectorProps) {
    const itemMap = Object.fromEntries(items.map((item) => [item.name, item]));

    const handleItemChange = (event: FormEvent<HTMLSelectElement>) => {
        const name = event.currentTarget.value;
        onItemChange(itemMap[name]);
    };

    return (
        <>
            <label htmlFor="output-select">Item:</label>
            <select id="output-select" onChange={handleItemChange}>
                {Object.keys(itemMap).map((name) => (
                    <option key={name}>{name}</option>
                ))}
            </select>
        </>
    );
}

export { ItemSelector };
