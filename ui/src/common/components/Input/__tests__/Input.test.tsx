import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { renderWithTestProviders as render } from "../../../../test/utils";
import Input from "..";

const expectedLabelText = "Label:";
const expectedErrorMessage = "A test error message";
const invalidInput = "test";
const mockOnChangeHandler = vi.fn();

async function typeValue({
    label,
    value,
}: {
    label: string;
    value: string;
}): Promise<void> {
    const user = userEvent.setup();
    const input = await screen.findByLabelText(label, {
        selector: "input",
    });

    await act(async () => {
        await user.type(input, value);
    });
}

async function clearInput({ label }: { label: string }): Promise<void> {
    const user = userEvent.setup();
    const input = await screen.findByLabelText(label, {
        selector: "input",
    });

    await act(async () => {
        await user.clear(input);
    });
}

function parseValue(value: unknown): number {
    const parsed = Number(value);
    if (isNaN(parsed)) {
        throw new Error();
    }

    return parsed;
}

beforeEach(() => {
    mockOnChangeHandler.mockReset();
});

test("renders an input with the provided label text", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
        />
    );

    expect(
        await screen.findByLabelText(expectedLabelText, {
            selector: "input",
        })
    ).toBeVisible();
});

test("calls the provided on change handler if a valid input is entered", async () => {
    const expectedValue = "123";

    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
        />
    );
    await typeValue({ label: expectedLabelText, value: expectedValue });

    expect(mockOnChangeHandler).toHaveBeenLastCalledWith(Number(expectedValue));
});

test("renders the provided error message if an invalid input is entered", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
            errorMessage={expectedErrorMessage}
        />
    );
    await typeValue({ label: expectedLabelText, value: invalidInput });

    const alert = await screen.findByRole("alert");
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(expectedErrorMessage);
});

test("does not render an error message by default", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
            errorMessage={expectedErrorMessage}
        />
    );
    await screen.findByLabelText(expectedLabelText, {
        selector: "input",
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("does not render an error message if invalid input is entered with no error message provided", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
        />
    );
    await typeValue({ label: expectedLabelText, value: invalidInput });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("sets the input to invalid if an invalid input is entered", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
        />
    );
    await typeValue({ label: expectedLabelText, value: invalidInput });

    expect(
        await screen.findByLabelText(expectedLabelText, {
            selector: "input",
        })
    ).toBeInvalid();
});

test("does not set the input to invalid by default", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
        />
    );

    expect(
        await screen.findByLabelText(expectedLabelText, {
            selector: "input",
        })
    ).toBeValid();
});

test("clears invalid state after changing input to valid input", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
        />
    );
    await typeValue({ label: expectedLabelText, value: invalidInput });

    expect(
        await screen.findByLabelText(expectedLabelText, {
            selector: "input",
        })
    ).toBeInvalid();

    await clearInput({ label: expectedLabelText });

    expect(
        await screen.findByLabelText(expectedLabelText, {
            selector: "input",
        })
    ).toBeValid();
});

test("clears error message if provided after changing input to valid input", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
            errorMessage={expectedErrorMessage}
        />
    );
    await typeValue({ label: expectedLabelText, value: invalidInput });

    expect(await screen.findByRole("alert")).toBeVisible();

    await clearInput({ label: expectedLabelText });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("provides undefined to change handler if invalid input is provided", async () => {
    render(
        <Input
            label={expectedLabelText}
            parseValue={parseValue}
            onChange={mockOnChangeHandler}
        />
    );
    await typeValue({ label: expectedLabelText, value: invalidInput });

    expect(mockOnChangeHandler).toHaveBeenLastCalledWith(undefined);
});
