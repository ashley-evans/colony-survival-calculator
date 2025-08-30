import { AutoCompleteSelector } from "../../../../common/components";

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
    const handleItemChange = (selectedItem: string | null) => {
        if (selectedItem) onItemChange(selectedItem);
    };

    const getItemFilter = (input: string) => {
        const lowercased = input.toLowerCase();

        return (item: string) => {
            return item.toLowerCase().includes(lowercased);
        };
    };

    return (
        <AutoCompleteSelector
            items={items}
            labelText="Item:"
            toggleLabelText="Open item list"
            inputPlaceholder="Select an item to use in calculations"
            clearIconLabelText="Clear item input"
            defaultSelectedItem={defaultSelectedItem}
            itemToKey={(value) => value}
            itemToDisplayText={(value) => value}
            getItemFilter={getItemFilter}
            onSelectedItemChange={handleItemChange}
        />
    );
}

export { ItemSelector };
