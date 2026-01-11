import { useMemo } from "react";

import { AutoCompleteSelector } from "../../../../common/components";
import { ItemName } from "../../../../graphql/__generated__/graphql";

type ItemSelectorProps = {
    items: ItemName[];
    onItemChange: (itemID: string) => void;
    defaultSelectedItemID?: string;
};

function ItemSelector({
    items,
    defaultSelectedItemID,
    onItemChange,
}: ItemSelectorProps) {
    const handleItemChange = (selectedItem: ItemName | null) => {
        if (selectedItem) onItemChange(selectedItem.id);
    };

    const getItemFilter = (input: string) => {
        const lowercased = input.toLowerCase();

        return (item: ItemName) => {
            return item.name.toLowerCase().includes(lowercased);
        };
    };

    const defaultItem = useMemo(
        () =>
            defaultSelectedItemID
                ? items.find((item) => item.id === defaultSelectedItemID)
                : undefined,
        [items, defaultSelectedItemID],
    );

    return (
        <AutoCompleteSelector
            items={items}
            labelText="Item:"
            toggleLabelText="Open item list"
            inputPlaceholder="Select an item to use in calculations"
            clearIconLabelText="Clear item input"
            defaultSelectedItem={defaultItem}
            itemToKey={(value) => value.id}
            itemToDisplayText={(value) => value.name}
            getItemFilter={getItemFilter}
            onSelectedItemChange={handleItemChange}
        />
    );
}

export { ItemSelector };
