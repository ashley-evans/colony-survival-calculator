import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Selector from "..";
import { renderWithTestProviders as render } from "../../../../test/utils";

type Item = { name: string };

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

const items: Item[] = [createItem("test item 1"), createItem("test item 2")];
const expectedLabelText = "Label text:";

it("renders a select with the provided label text", async () => {
    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={items[0]}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );

    expect(
        await screen.findByRole("combobox", { name: expectedLabelText })
    ).toBeVisible();
});

it("does not render any options by default", async () => {
    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={items[0]}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await screen.findByRole("combobox", { name: expectedLabelText });

    for (const item of items) {
        expect(
            screen.queryByRole("option", { name: item.name })
        ).not.toBeInTheDocument();
    }
});

it("shows the provided default value as the default shown item", async () => {
    const expectedDefaultItem = items[0];

    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={expectedDefaultItem}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );

    expect(
        await screen.findByRole("combobox", { name: expectedLabelText })
    ).toHaveTextContent(expectedDefaultItem.name);
});

it("show each item provided as an option in the select when clicked", async () => {
    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={items[0]}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await clickSelect(expectedLabelText);

    for (const item of items) {
        expect(
            await screen.findByRole("option", { name: item.name })
        ).toBeVisible();
    }
});

it("shows the provided default item as selected in the option list by default", async () => {
    const expectedDefaultItem = items[0];

    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={expectedDefaultItem}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await clickSelect(expectedLabelText);

    expect(
        await screen.findByRole("option", {
            name: expectedDefaultItem.name,
            selected: true,
        })
    ).toBeVisible();
});

it("updates the shown item when a different item is selected", async () => {
    const expectedShownItem = items[1];

    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={items[0]}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await clickSelect(expectedLabelText);
    await clickOption(expectedShownItem.name);

    expect(
        await screen.findByRole("combobox", { name: expectedLabelText })
    ).toHaveTextContent(expectedShownItem.name);
});

it("updates the selected item in the option list after a different item is selected", async () => {
    const expectedSelectedItem = items[1];
    const expectedDeselectedItem = items[0];

    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={expectedDeselectedItem}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await clickSelect(expectedLabelText);
    await clickOption(expectedSelectedItem.name);
    await clickSelect(expectedLabelText);

    expect(
        await screen.findByRole("option", {
            name: expectedSelectedItem.name,
            selected: true,
        })
    ).toBeVisible();
    expect(
        screen.getByRole("option", {
            name: expectedDeselectedItem.name,
            selected: false,
        })
    ).toBeVisible();
});
