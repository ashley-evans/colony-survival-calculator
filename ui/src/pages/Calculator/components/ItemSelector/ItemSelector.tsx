import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
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
            labelText={t("calculator.items.selector.label")}
            toggleLabelText={t("calculator.items.selector.toggle")}
            inputPlaceholder={t("calculator.items.selector.placeholder")}
            clearIconLabelText={t("calculator.items.selector.clear")}
            defaultSelectedItem={defaultItem}
            itemToKey={(value) => value.id}
            itemToDisplayText={(value) => value.name}
            getItemFilter={getItemFilter}
            onSelectedItemChange={handleItemChange}
        />
    );
}

export { ItemSelector };
