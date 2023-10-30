import React from "react";
import { screen } from "@testing-library/react";
import { vi } from "vitest";

import { click, renderWithTestProviders as render } from "../../../../test";
import { Checkbox } from "../Checkbox";

const expectedLabelText = "Checkbox label:";
const mockOnChangeHandler = vi.fn();

beforeEach(() => {
    mockOnChangeHandler.mockReset();
});

test("renders a checkbox with the provided label text", async () => {
    render(<Checkbox label={expectedLabelText} />);

    expect(
        await screen.findByRole("checkbox", { name: expectedLabelText })
    ).toBeVisible();
});

test("defaults to not checked if no default provided", async () => {
    render(<Checkbox label={expectedLabelText} />);

    expect(
        await screen.findByRole("checkbox", { name: expectedLabelText })
    ).not.toBeChecked();
});

test("defaults to checked if default of checked provided", async () => {
    render(<Checkbox label={expectedLabelText} checked={true} />);

    expect(
        await screen.findByRole("checkbox", { name: expectedLabelText })
    ).toBeChecked();
});

test("does not call on change handler when default assigned", async () => {
    render(
        <Checkbox
            label={expectedLabelText}
            checked={true}
            onChange={mockOnChangeHandler}
        />
    );
    await screen.findByRole("checkbox", { name: expectedLabelText });

    expect(mockOnChangeHandler).not.toHaveBeenCalled();
});

test("changes checkbox to checked when clicked (default unchecked)", async () => {
    render(
        <Checkbox label={expectedLabelText} onChange={mockOnChangeHandler} />
    );
    await click({ label: expectedLabelText, role: "checkbox" });

    expect(
        screen.getByRole("checkbox", { name: expectedLabelText })
    ).toBeChecked();
    expect(mockOnChangeHandler).toHaveBeenCalledTimes(1);
    expect(mockOnChangeHandler).toHaveBeenCalledWith(true);
});

test("changes checkbox to unchecked when clicked (default checked)", async () => {
    render(
        <Checkbox
            label={expectedLabelText}
            onChange={mockOnChangeHandler}
            checked={true}
        />
    );
    await click({ label: expectedLabelText, role: "checkbox" });

    expect(
        screen.getByRole("checkbox", { name: expectedLabelText })
    ).not.toBeChecked();
    expect(mockOnChangeHandler).toHaveBeenCalledTimes(1);
    expect(mockOnChangeHandler).toHaveBeenCalledWith(false);
});
