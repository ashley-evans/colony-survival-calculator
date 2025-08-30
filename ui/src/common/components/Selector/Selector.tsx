import React, { useEffect } from "react";
import { useSelect, UseSelectProps, UseSelectStateChange } from "downshift";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import {
    Container,
    Item,
    Label,
    Menu,
    SelectorInputContainer,
    ToggleIndicatorIcon,
} from "./styles";
import { ColorPalettes } from "../..";

interface SelectorProps<Item> extends Pick<UseSelectProps<Item>, "items"> {
    labelText: string;
    itemToKey: (item: Item, index: number) => string;
    itemToDisplayText: (item: Item) => string;
    defaultSelectedItem: Item;
    onSelectedItemChange?: (item?: Item) => void;
    palette?: ColorPalettes;
    className?: string;
}

function Selector<Item>({
    items,
    labelText,
    itemToKey,
    itemToDisplayText,
    defaultSelectedItem,
    onSelectedItemChange,
    palette = "secondary",
    className,
}: SelectorProps<Item>) {
    const handleSelectedItemChange = (changes: UseSelectStateChange<Item>) => {
        if (onSelectedItemChange) {
            onSelectedItemChange(changes.selectedItem ?? undefined);
        }
    };

    const {
        isOpen,
        selectedItem,
        getLabelProps,
        getToggleButtonProps,
        getMenuProps,
        getItemProps,
        selectItem,
    } = useSelect({
        items,
        defaultSelectedItem,
        onSelectedItemChange: handleSelectedItemChange,
    });

    useEffect(() => {
        selectItem(defaultSelectedItem);
    }, [defaultSelectedItem]);

    return (
        <Container palette={palette} className={className}>
            <Label {...getLabelProps()}>{labelText}</Label>
            <SelectorInputContainer
                {...getToggleButtonProps()}
                palette={palette}
            >
                <span>
                    {itemToDisplayText(
                        selectedItem ? selectedItem : defaultSelectedItem,
                    )}
                </span>
                <ToggleIndicatorIcon icon={faChevronDown} selected={isOpen} />
            </SelectorInputContainer>
            <Menu {...getMenuProps()} isOpen={isOpen} palette={palette}>
                {isOpen ? (
                    <>
                        {items.map((item, index) => (
                            <Item
                                key={itemToKey(item, index)}
                                {...getItemProps({ item, index })}
                                palette={palette}
                            >
                                {itemToDisplayText(item)}
                            </Item>
                        ))}
                    </>
                ) : null}
            </Menu>
        </Container>
    );
}

export { Selector };
