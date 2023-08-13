import userEvent from "@testing-library/user-event";
import { act, screen } from "@testing-library/react";

export type Item = { name: string };

function createItem(itemName: string): Item {
    return { name: itemName };
}

function itemToKey(item: Item, index: number): string {
    return `${item.name}-${index}`;
}

function itemToDisplayText(item: Item): string {
    return item.name;
}

async function clickSelect(label: string): Promise<void> {
    const user = userEvent.setup();
    const select = await screen.findByRole("combobox", {
        name: label,
    });
    await act(async () => {
        await user.click(select);
    });
}

async function clickOption(option: string): Promise<void> {
    const user = userEvent.setup();
    const optionElement = await screen.findByRole("option", {
        name: option,
    });
    await act(async () => {
        await user.click(optionElement);
    });
}

export { createItem, itemToKey, itemToDisplayText, clickSelect, clickOption };
