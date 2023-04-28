import React from "react";

import { Item } from "../../../../graphql/__generated__/graphql";
import Selector from "../../../../common/components/Selector";

type ItemName = Pick<Item, "name">;

type ItemSelectorProps = {
    items: ItemName[];
    onItemChange: (item: string) => void;
};

function ItemSelector({ items, onItemChange }: ItemSelectorProps) {
    const handleItemChange = (selectedItem?: ItemName) => {
        if (selectedItem) onItemChange(selectedItem.name);
    };

    return (
        <Selector
            items={items}
            itemToKey={(item) => item.name}
            itemToDisplayText={(item) => item.name}
            labelText="Item:"
            defaultSelectedItem={items[0]}
            onSelectedItemChange={handleItemChange}
            palette="secondary"
        />
    );
}

export { ItemSelector };
