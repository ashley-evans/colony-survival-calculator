import React from "react";
import { useSelect, UseSelectProps } from "downshift";

import { Container, Item, Menu, ToggleButton } from "./styles";

interface SelectorProps<Item> extends UseSelectProps<Item> {
    labelText: string;
    itemToKey: (item: Item, index: number) => string;
    itemToDisplayText: (item: Item) => string;
    defaultSelectedItem: Item;
}

function Selector<Item>({
    items,
    itemToKey,
    itemToDisplayText,
    labelText,
    defaultSelectedItem,
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
        <Container>
            <label {...getLabelProps()}>{labelText}</label>
            <ToggleButton {...getToggleButtonProps()}>
                <span>
                    {itemToDisplayText(
                        selectedItem ? selectedItem : defaultSelectedItem
                    )}
                </span>
            </ToggleButton>
            <Menu {...getMenuProps()} isOpen={isOpen}>
                {isOpen ? (
                    <>
                        {items.map((item, index) => (
                            <Item
                                key={itemToKey(item, index)}
                                {...getItemProps({ item, index })}
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
