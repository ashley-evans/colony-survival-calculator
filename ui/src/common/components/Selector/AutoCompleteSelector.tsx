import React, { useEffect, useState } from "react";
import {
    UseComboboxProps,
    UseComboboxStateChange,
    useCombobox,
} from "downshift";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import { ColorPalettes } from "../..";
import {
    Container,
    Input,
    Item,
    Menu,
    SelectorInputContainer,
    ToggleIndicatorIcon,
} from "./styles";

interface AutoCompleteSelectorProps<Item>
    extends Pick<UseComboboxProps<Item>, "items" | "defaultSelectedItem"> {
    labelText: string;
    toggleLabelText: string;
    inputPlaceholder: string;
    itemToKey: (item: Item, index: number) => string;
    itemToDisplayText: (item: Item) => string;
    getItemFilter?: (input: string) => (item: Item) => boolean;
    onSelectedItemChange?: (item: Item | null) => void;
    palette?: ColorPalettes;
    className?: string;
}

function AutoCompleteSelector<Item>({
    items,
    defaultSelectedItem,
    labelText,
    toggleLabelText,
    inputPlaceholder,
    palette = "secondary",
    className,
    itemToDisplayText,
    itemToKey,
    getItemFilter,
    onSelectedItemChange,
}: AutoCompleteSelectorProps<Item>) {
    const [filtered, setFiltered] = useState<Item[]>(items);

    const handleInputChange = ({
        inputValue,
    }: UseComboboxStateChange<Item>) => {
        setFiltered(
            getItemFilter && inputValue
                ? items.filter(getItemFilter(inputValue))
                : items
        );
    };

    const {
        isOpen,
        getLabelProps,
        getInputProps,
        getToggleButtonProps,
        getMenuProps,
        getItemProps,
        selectItem,
    } = useCombobox({
        items: filtered,
        defaultSelectedItem,
        onInputValueChange: handleInputChange,
        onSelectedItemChange: ({ selectedItem }) => {
            if (onSelectedItemChange) {
                onSelectedItemChange(selectedItem ?? null);
            }
        },
        itemToString: (item) => {
            return item ? itemToDisplayText(item) : "";
        },
    });

    useEffect(() => {
        selectItem(defaultSelectedItem ?? null);
    }, [defaultSelectedItem]);

    return (
        <Container palette={palette} className={className}>
            <label {...getLabelProps()}>{labelText}</label>
            <SelectorInputContainer palette={palette}>
                <Input {...getInputProps()} placeholder={inputPlaceholder} />
                <ToggleIndicatorIcon
                    {...getToggleButtonProps()}
                    icon={faChevronDown}
                    selected={isOpen}
                    role="button"
                    aria-hidden={false}
                    aria-label={toggleLabelText}
                />
            </SelectorInputContainer>
            <Menu
                {...getMenuProps()}
                isOpen={isOpen && filtered.length > 0}
                palette={palette}
            >
                {isOpen ? (
                    <>
                        {filtered.map((item, index) => (
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

export { AutoCompleteSelector };
