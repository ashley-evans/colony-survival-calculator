import React from "react";
import { screen } from "@testing-library/react";
import { vi } from "vitest";

import { Selector } from "../Selector";
import {
    renderWithTestProviders as render,
    wrapWithTestProviders,
    openSelectMenu,
    selectOption,
} from "../../../../test/utils";

import { Item, createItem, itemToKey, itemToDisplayText } from "./utils";

const items: Item[] = [createItem("test item 1"), createItem("test item 2")];
const expectedLabelText = "Label text:";

test("renders a select with the provided label text", async () => {
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

test("does not render any options by default", async () => {
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

test("shows the provided default value as the default shown item", async () => {
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

test("show each item provided as an option in the select when clicked", async () => {
    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={items[0]}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await openSelectMenu({ label: expectedLabelText });

    for (const item of items) {
        expect(
            await screen.findByRole("option", { name: item.name })
        ).toBeVisible();
    }
});

test("shows the provided default item as selected in the option list by default", async () => {
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
    await openSelectMenu({ label: expectedLabelText });

    expect(
        await screen.findByRole("option", {
            name: expectedDefaultItem.name,
            selected: true,
        })
    ).toBeVisible();
});

test("updates the shown item when a different item is selected", async () => {
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
    await openSelectMenu({ label: expectedLabelText });
    await selectOption({ optionName: expectedShownItem.name });

    expect(
        await screen.findByRole("combobox", { name: expectedLabelText })
    ).toHaveTextContent(expectedShownItem.name);
});

test("updates the selected item in the option list after a different item is selected", async () => {
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
    await openSelectMenu({ label: expectedLabelText });
    await selectOption({ optionName: expectedSelectedItem.name });
    await openSelectMenu({ label: expectedLabelText });

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

test("calls the provided on change function when an item is selected", async () => {
    const mockOnItemChange = vi.fn();
    const expectedItem = items[1];

    render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={items[0]}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
            onSelectedItemChange={mockOnItemChange}
        />
    );
    await openSelectMenu({ label: expectedLabelText });
    await selectOption({ optionName: expectedItem.name });
    await screen.findByText(expectedItem.name);

    expect(mockOnItemChange).toHaveBeenCalledTimes(1);
    expect(mockOnItemChange).toHaveBeenCalledWith(expectedItem);
});

test("calls the provided on change function when the default item is changed", async () => {
    const mockOnItemChange = vi.fn();
    const expectedItem = items[1];
    const { rerender } = render(
        <Selector
            items={items}
            labelText={expectedLabelText}
            defaultSelectedItem={items[0]}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
            onSelectedItemChange={mockOnItemChange}
        />
    );

    rerender(
        wrapWithTestProviders(
            <Selector
                items={items}
                labelText={expectedLabelText}
                defaultSelectedItem={expectedItem}
                itemToKey={itemToKey}
                itemToDisplayText={itemToDisplayText}
                onSelectedItemChange={mockOnItemChange}
            />
        )
    );

    expect(mockOnItemChange).toHaveBeenCalledTimes(1);
    expect(mockOnItemChange).toHaveBeenCalledWith(expectedItem);
});
