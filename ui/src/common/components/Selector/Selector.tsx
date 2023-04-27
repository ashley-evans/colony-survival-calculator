import React from "react";
import { useSelect, UseSelectProps } from "downshift";

import { Container, Item, Menu, ToggleButton } from "./styles";
import { ColorPallettes } from "../..";

interface SelectorProps<Item> extends UseSelectProps<Item> {
    labelText: string;
    itemToKey: (item: Item, index: number) => string;
    itemToDisplayText: (item: Item) => string;
    defaultSelectedItem: Item;
    palette?: ColorPallettes;
}

function Selector<Item>({
    items,
    itemToKey,
    itemToDisplayText,
    labelText,
    defaultSelectedItem,
    palette = "secondary",
}: SelectorProps<Item>) {
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
    });

    return (
        <Container pallette={palette}>
            <label {...getLabelProps()}>{labelText}</label>
            <ToggleButton {...getToggleButtonProps()} pallette={palette}>
                <span>
                    {itemToDisplayText(
                        selectedItem ? selectedItem : defaultSelectedItem
                    )}
                </span>
            </ToggleButton>
            <Menu {...getMenuProps()} isOpen={isOpen} pallette={palette}>
                {isOpen ? (
                    <>
                        {items.map((item, index) => (
                            <Item
                                key={itemToKey(item, index)}
                                {...getItemProps({ item, index })}
                                pallette={palette}
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
