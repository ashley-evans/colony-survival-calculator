import React from "react";

import { Selector } from "../../../../common/components";

type ItemSelectorProps = {
    items: string[];
    onItemChange: (item: string) => void;
};

function ItemSelector({ items, onItemChange }: ItemSelectorProps) {
    const handleItemChange = (selectedItem?: string) => {
        if (selectedItem) onItemChange(selectedItem);
    };

    return (
        <Selector
            items={items}
            itemToKey={(item) => item}
            itemToDisplayText={(item) => item}
            labelText="Item:"
            defaultSelectedItem={items[0]}
            onSelectedItemChange={handleItemChange}
            palette="secondary"
        />
    );
}

export { ItemSelector };
