import React, { FormEvent } from "react";

import { Item } from "../../../../graphql/__generated__/graphql";

type ItemNames = Pick<Item, "name">[];

type ItemSelectorProps = {
    items: ItemNames;
    onItemChange: (item: string) => void;
};

function ItemSelector({ items, onItemChange }: ItemSelectorProps) {
    const handleItemChange = (event: FormEvent<HTMLSelectElement>) => {
        const name = event.currentTarget.value;
        onItemChange(name);
    };

    return (
        <>
            <label htmlFor="output-select">Item:</label>
            <select id="output-select" onChange={handleItemChange}>
                {Object.values(items).map((item) => (
                    <option key={item.name}>{item.name}</option>
                ))}
            </select>
        </>
    );
}

export { ItemSelector };
