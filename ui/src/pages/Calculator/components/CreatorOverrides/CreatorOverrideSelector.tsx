import React, { useState } from "react";
import { faRemove } from "@fortawesome/free-solid-svg-icons";

import { Selector } from "../../../../common";
import { CreatorOverride } from "../../../../graphql/__generated__/graphql";
import {
    Icon,
    OverrideContainer,
    RemoveButton,
    RemoveButtonContainer,
} from "./styles";

type CreatorOverrideSelectorProps = {
    defaultOverride: CreatorOverride;
    items: string[];
    creators: string[];
    onSelectedItemChange: (newItem: string, oldItem: string) => void;
    onSelectedCreatorChange: (item: string, newCreator: string) => void;
    onRemove: (selectedItem: string) => void;
};

function CreatorOverrideSelector({
    defaultOverride,
    items,
    creators,
    onSelectedItemChange,
    onSelectedCreatorChange,
    onRemove,
}: CreatorOverrideSelectorProps) {
    const [selectedItem, setSelectedItem] = useState<string>(
        defaultOverride.itemName
    );

    const handleSelectedItemChange = (value?: string) => {
        if (!value) {
            return;
        }

        const oldItem = selectedItem;
        setSelectedItem(value);
        onSelectedItemChange(value, oldItem);
    };

    const handleSelectedCreatorChange = (value?: string) => {
        if (!value) {
            return;
        }

        onSelectedCreatorChange(selectedItem, value);
    };

    const handleRemove = () => {
        onRemove(selectedItem);
    };

    return (
        <OverrideContainer>
            <Selector
                items={items}
                itemToKey={(name) => name}
                itemToDisplayText={(name) => name}
                labelText="Item:"
                defaultSelectedItem={defaultOverride.itemName}
                onSelectedItemChange={handleSelectedItemChange}
            />
            <Selector
                items={creators}
                itemToKey={(creator) => creator}
                itemToDisplayText={(creator) => creator}
                labelText="Creator:"
                defaultSelectedItem={defaultOverride.creator}
                onSelectedItemChange={handleSelectedCreatorChange}
            />
            <RemoveButtonContainer>
                <RemoveButton onClick={handleRemove}>
                    <span>Remove</span>
                    <Icon icon={faRemove} />
                </RemoveButton>
            </RemoveButtonContainer>
        </OverrideContainer>
    );
}

export { CreatorOverrideSelector };
