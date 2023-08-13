import React from "react";
import { screen, waitFor } from "@testing-library/react";

import { Item, createItem, itemToKey, itemToDisplayText } from "./utils";
import { AutoCompleteSelector } from "../AutoCompleteSelector";
import {
    clickButton,
    renderWithTestProviders as render,
    typeValue,
    wrapWithTestProviders,
    openSelectMenu,
    selectOption,
} from "../../../../test/utils";
import { vi } from "vitest";

const items: Item[] = [createItem("test item 1"), createItem("test item 2")];
const expectedLabelText = "Label text:";
const expectedInputPlaceholder = "Placeholder text";
const expectedDefaultItem = items[0];
const expectedToggleLabelText = "Toggle label text";
const expectedClearLabelText = "Clear item input";
const mockOnItemChange = vi.fn();

const getItemFilter = (inputValue: string) => {
    const lowercased = inputValue.toLowerCase();

    return (item: Item) => {
        return item.name.toLowerCase().includes(lowercased);
    };
};

beforeEach(() => {
    mockOnItemChange.mockReset();
});

test("renders an combobox with the provided label text", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );

    expect(
        await screen.findByRole("combobox", { name: expectedLabelText })
    ).toBeVisible();
});

test("renders the combobox as an input", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );

    expect(
        await screen.findByLabelText(expectedLabelText, {
            selector: "input",
        })
    ).toBeVisible();
});

test("shows placeholder text if a default value is not provided", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    const combobox = await screen.findByRole("combobox", {
        name: expectedLabelText,
    });

    expect(combobox).toHaveAttribute("placeholder", expectedInputPlaceholder);
});

test("shows the default if provided", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            defaultSelectedItem={expectedDefaultItem}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );

    expect(
        await screen.findByRole("combobox", { name: expectedLabelText })
    ).toHaveValue(expectedDefaultItem.name);
});

test("does not render any options by default", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            defaultSelectedItem={expectedDefaultItem}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
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

test("renders a toggle button", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            defaultSelectedItem={expectedDefaultItem}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );

    expect(
        await screen.findByRole("button", { name: expectedToggleLabelText })
    ).toBeVisible();
});

test.each([
    ["default not provided", undefined],
    ["default provided", expectedDefaultItem],
])(
    "show each item provided as an option in the select when clicked if no filter specified and %s (clicking toggle button)",
    async (_: string, defaultSelectedItem: Item | undefined) => {
        render(
            <AutoCompleteSelector
                items={items}
                labelText={expectedLabelText}
                toggleLabelText={expectedToggleLabelText}
                inputPlaceholder={expectedInputPlaceholder}
                defaultSelectedItem={defaultSelectedItem}
                itemToKey={itemToKey}
                itemToDisplayText={itemToDisplayText}
            />
        );
        await clickButton({ label: expectedToggleLabelText });

        expect(await screen.findAllByRole("option")).toHaveLength(items.length);
        for (const item of items) {
            expect(
                screen.getByRole("option", { name: item.name })
            ).toBeVisible();
        }
    }
);

test.each([
    ["default not provided", undefined],
    ["default provided", expectedDefaultItem],
])(
    "show each item provided as an option in the select when clicked if no filter specified and %s (clicking select)",
    async (_: string, defaultSelectedItem: Item | undefined) => {
        render(
            <AutoCompleteSelector
                items={items}
                labelText={expectedLabelText}
                toggleLabelText={expectedToggleLabelText}
                inputPlaceholder={expectedInputPlaceholder}
                defaultSelectedItem={defaultSelectedItem}
                itemToKey={itemToKey}
                itemToDisplayText={itemToDisplayText}
            />
        );
        await openSelectMenu({ label: expectedLabelText });

        expect(await screen.findAllByRole("option")).toHaveLength(items.length);
        for (const item of items) {
            expect(
                screen.getByRole("option", { name: item.name })
            ).toBeVisible();
        }
    }
);

test("changing the input value does not filter the menu if no filter provided", async () => {
    const input = "test value";

    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await typeValue({ label: expectedLabelText, value: input });
    await waitFor(() =>
        expect(
            screen.getByRole("combobox", { name: expectedLabelText })
        ).toHaveValue(input)
    );

    expect(screen.getAllByRole("option")).toHaveLength(items.length);
    for (const item of items) {
        expect(screen.getByRole("option", { name: item.name })).toBeVisible();
    }
});

test("changing the input value filters the menu if filter is provide (no matches)", async () => {
    const input = "unknown";
    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
            getItemFilter={getItemFilter}
        />
    );
    await typeValue({ label: expectedLabelText, value: input });
    await waitFor(() =>
        expect(
            screen.getByRole("combobox", { name: expectedLabelText })
        ).toHaveValue(input)
    );

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
});

test.each([
    ["partial match", items[0].name, [items[0]]],
    ["all matched", "item", items],
])(
    "changing the input value filters the menu if filter is provided (%s)",
    async (_: string, input: string, expectedItems: Item[]) => {
        render(
            <AutoCompleteSelector
                items={items}
                labelText={expectedLabelText}
                toggleLabelText={expectedToggleLabelText}
                inputPlaceholder={expectedInputPlaceholder}
                itemToKey={itemToKey}
                itemToDisplayText={itemToDisplayText}
                getItemFilter={getItemFilter}
            />
        );
        await typeValue({ label: expectedLabelText, value: input });
        await waitFor(() =>
            expect(
                screen.getByRole("combobox", { name: expectedLabelText })
            ).toHaveValue(input)
        );

        expect(screen.getAllByRole("option")).toHaveLength(
            expectedItems.length
        );
        for (const item of expectedItems) {
            expect(
                screen.getByRole("option", { name: item.name })
            ).toBeVisible();
        }
    }
);

test("does not apply default value as filter if filter and default provided", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            defaultSelectedItem={expectedDefaultItem}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
            getItemFilter={getItemFilter}
        />
    );
    await openSelectMenu({ label: expectedLabelText });

    expect(screen.getAllByRole("option")).toHaveLength(items.length);
    for (const item of items) {
        expect(screen.getByRole("option", { name: item.name })).toBeVisible();
    }
});

test("calls the provided on change function when an item is selected", async () => {
    const mockOnItemChange = vi.fn();
    const expectedItem = items[1];

    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            defaultSelectedItem={expectedDefaultItem}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
            getItemFilter={getItemFilter}
            onSelectedItemChange={mockOnItemChange}
        />
    );
    await openSelectMenu({ label: expectedLabelText });
    await selectOption({ optionName: expectedItem.name });
    await waitFor(() =>
        expect(
            screen.getByRole("combobox", { name: expectedLabelText })
        ).toHaveValue(expectedItem.name)
    );

    expect(mockOnItemChange).toHaveBeenCalledTimes(1);
    expect(mockOnItemChange).toHaveBeenCalledWith(expectedItem);
});

test("calls the provided on change function when the default item is changed", async () => {
    const mockOnItemChange = vi.fn();
    const expectedItem = items[1];
    const { rerender } = render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            defaultSelectedItem={expectedDefaultItem}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
            getItemFilter={getItemFilter}
            onSelectedItemChange={mockOnItemChange}
        />
    );

    rerender(
        wrapWithTestProviders(
            <AutoCompleteSelector
                items={items}
                labelText={expectedLabelText}
                toggleLabelText={expectedToggleLabelText}
                inputPlaceholder={expectedInputPlaceholder}
                defaultSelectedItem={expectedItem}
                itemToKey={itemToKey}
                itemToDisplayText={itemToDisplayText}
                getItemFilter={getItemFilter}
                onSelectedItemChange={mockOnItemChange}
            />
        )
    );

    expect(mockOnItemChange).toHaveBeenCalledTimes(1);
    expect(mockOnItemChange).toHaveBeenCalledWith(expectedItem);
});

test("does not call the provided on change function when an invalid item is typed", async () => {
    const input = "unknown";

    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            defaultSelectedItem={expectedDefaultItem}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
            getItemFilter={getItemFilter}
            onSelectedItemChange={mockOnItemChange}
        />
    );
    await typeValue({ label: expectedLabelText, value: input });

    expect(mockOnItemChange).toHaveBeenCalledTimes(0);
});

test("renders a clear input button with the provided label if specified and value entered", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            clearIconLabelText={expectedClearLabelText}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await typeValue({ label: expectedLabelText, value: "1" });

    expect(
        await screen.findByRole("button", { name: expectedClearLabelText })
    ).toBeVisible();
});

test("does not render a clear input button if no label is specified and value entered", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await typeValue({ label: expectedLabelText, value: "1" });

    expect(
        screen.queryByRole("button", { name: expectedClearLabelText })
    ).not.toBeInTheDocument();
});

test("does not render a clear input button if no value entered and label is specified", async () => {
    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            clearIconLabelText={expectedClearLabelText}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await screen.findByRole("combobox", { name: expectedLabelText });

    expect(
        screen.queryByRole("button", { name: expectedClearLabelText })
    ).not.toBeInTheDocument();
});

test("clears the currently entered value if the clear input button is pressed", async () => {
    const expectedRemovedValue = "123";

    render(
        <AutoCompleteSelector
            items={items}
            labelText={expectedLabelText}
            toggleLabelText={expectedToggleLabelText}
            inputPlaceholder={expectedInputPlaceholder}
            clearIconLabelText={expectedClearLabelText}
            itemToKey={itemToKey}
            itemToDisplayText={itemToDisplayText}
        />
    );
    await typeValue({ label: expectedLabelText, value: expectedRemovedValue });
    await clickButton({ label: expectedClearLabelText });

    await waitFor(() =>
        expect(
            screen.getByRole("combobox", { name: expectedLabelText })
        ).toHaveValue("")
    );
});
