import React from "react";

import { Selector } from "../../../../common/components";

type ItemSelectorProps = {
    items: string[];
    onItemChange: (item: string) => void;
    defaultSelectedItem?: string;
};

function ItemSelector({
    items,
    defaultSelectedItem,
    onItemChange,
}: ItemSelectorProps) {
    const handleItemChange = (selectedItem?: string) => {
        if (selectedItem) onItemChange(selectedItem);
    };

    return (
        <Selector
            items={items}
            itemToKey={(item) => item}
            itemToDisplayText={(item) => item}
            labelText="Item:"
            defaultSelectedItem={defaultSelectedItem ?? items[0]}
            onSelectedItemChange={handleItemChange}
            palette="secondary"
        />
    );
}

export { ItemSelector };
