import { useState } from "react";
import { faRemove } from "@fortawesome/free-solid-svg-icons";

import { Selector } from "../../../../common";
import {
    Icon,
    OverrideContainer,
    RemoveButton,
    RemoveButtonContainer,
} from "./styles";

type NamedEntity = { id: string; name: string };

type CreatorOverrideSelectorProps = {
    defaultItem: NamedEntity;
    defaultCreator: NamedEntity;
    items: NamedEntity[];
    creators: NamedEntity[];
    onSelectedItemChange: (newItemID: string, oldItemID: string) => void;
    onSelectedCreatorChange: (itemID: string, newCreatorID: string) => void;
    onRemove: (selectedItemID: string) => void;
};

function CreatorOverrideSelector({
    defaultItem,
    defaultCreator,
    items,
    creators,
    onSelectedItemChange,
    onSelectedCreatorChange,
    onRemove,
}: CreatorOverrideSelectorProps) {
    const [selectedItemID, setSelectedItemID] = useState<string>(
        defaultItem.id,
    );

    const handleSelectedItemChange = (value?: NamedEntity) => {
        if (!value) {
            return;
        }

        const oldItemID = selectedItemID;
        setSelectedItemID(value.id);
        onSelectedItemChange(value.id, oldItemID);
    };

    const handleSelectedCreatorChange = (value?: NamedEntity) => {
        if (!value) {
            return;
        }

        onSelectedCreatorChange(selectedItemID, value.id);
    };

    const handleRemove = () => {
        onRemove(selectedItemID);
    };

    return (
        <OverrideContainer>
            <Selector
                items={items}
                itemToKey={(item) => item.id}
                itemToDisplayText={(item) => item.name}
                labelText="Item:"
                defaultSelectedItem={defaultItem}
                onSelectedItemChange={handleSelectedItemChange}
            />
            <Selector
                items={creators}
                itemToKey={(creator) => creator.id}
                itemToDisplayText={(creator) => creator.name}
                labelText="Creator:"
                defaultSelectedItem={defaultCreator}
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
