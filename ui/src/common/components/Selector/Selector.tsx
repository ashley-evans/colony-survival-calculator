import React from "react";
import { useSelect, UseSelectProps, UseSelectStateChange } from "downshift";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import {
    Container,
    Item,
    Menu,
    ToggleButton,
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
    } = useSelect({
        items,
        defaultSelectedItem,
        onSelectedItemChange: handleSelectedItemChange,
    });

    return (
        <Container palette={palette} className={className}>
            <label {...getLabelProps()}>{labelText}</label>
            <ToggleButton {...getToggleButtonProps()} palette={palette}>
                <span>
                    {itemToDisplayText(
                        selectedItem ? selectedItem : defaultSelectedItem
                    )}
                </span>
                <ToggleIndicatorIcon icon={faChevronDown} selected={isOpen} />
            </ToggleButton>
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
