import { HttpResponse, graphql } from "msw";
import { setupServer } from "msw/node";
import { screen, within } from "@testing-library/react";

import Calculator from "../Calculator";
import { renderWithTestProviders as render } from "../../../test/utils";
import {
    selectItemAndTarget,
    expectedWorkerInputLabel,
    expectedCalculatorTab,
    expectedSettingsTab,
    clickByName,
    expectedSettingsTabHeader,
    ItemName,
    expectedCreatorOverrideQueryName,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
    expectedTargetAmountInputLabel,
    expectedRequirementsHeading,
} from "./utils";
import { createCalculatorOutputResponseHandler } from "./utils/handlers";

const item: ItemName = { name: "Item 1" };

const server = setupServer(
    graphql.query(expectedItemNameQueryName, () => {
        return HttpResponse.json({
            data: {
                distinctItemNames: [item.name],
            },
        });
    }),
    graphql.query(expectedItemDetailsQueryName, () => {
        return HttpResponse.json({
            data: {
                item: [],
            },
        });
    }),
    createCalculatorOutputResponseHandler([]),
    graphql.query(expectedCreatorOverrideQueryName, () => {
        return HttpResponse.json({ data: { item: [] } });
    }),
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
    server.events.removeAllListeners();
});

describe("worker input rendering", () => {
    const expectedErrorMessage =
        "Invalid output item workers, must be a positive non-zero whole number";

    test("renders an input to enter the number of workers", async () => {
        render(<Calculator />);

        const input = await screen.findByLabelText(expectedWorkerInputLabel, {
            selector: "input",
        });
        expect(input).toBeVisible();
        expect(input).toHaveValue("");
    });

    test("does not render an error message by default", async () => {
        render(<Calculator />);
        await screen.findByLabelText(expectedWorkerInputLabel, {
            selector: "input",
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    describe.each([
        ["negative", "-1"],
        ["zero", "0"],
        ["float", "1.1"],
        ["not a number", "test"],
        ["number with invalid character suffix", "3-test"],
    ])(
        "renders invalid workers message if workers is %s",
        (_: string, input: string) => {
            test("renders invalid workers message", async () => {
                render(<Calculator />);
                await selectItemAndTarget({
                    itemName: item.name,
                    workers: input,
                });

                expect(await screen.findByRole("alert")).toHaveTextContent(
                    expectedErrorMessage,
                );
            });

            test("does not render requirements section", async () => {
                render(<Calculator />);
                await selectItemAndTarget({
                    itemName: item.name,
                    workers: input,
                });
                await screen.findByRole("alert");

                expect(
                    screen.queryByRole("heading", {
                        name: expectedRequirementsHeading,
                    }),
                ).not.toBeInTheDocument();
            });
        },
    );

    test("clears error message after changing input to a valid input", async () => {
        const invalidInput = "Invalid";
        const validInput = "1";

        render(<Calculator />);
        await selectItemAndTarget({
            itemName: item.name,
            workers: invalidInput,
        });
        await screen.findByRole("alert");
        await selectItemAndTarget({ workers: validInput, clear: true });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    test("renders clear button with correct label if input has value", async () => {
        render(<Calculator />);
        await selectItemAndTarget({
            workers: "1",
        });
        const inputContainer = (
            await screen.findByLabelText(expectedWorkerInputLabel, {
                selector: "input",
            })
        ).parentElement as HTMLElement;

        expect(
            await within(inputContainer).findByRole("button", {
                name: "Clear output item workers",
            }),
        ).toBeVisible();
    });

    test("does not reset input after tab is changed", async () => {
        const expectedWorkerValue = "24";

        render(<Calculator />);
        await selectItemAndTarget({ workers: expectedWorkerValue });
        await clickByName(expectedSettingsTab, "tab");
        await screen.findByRole("heading", {
            name: expectedSettingsTabHeader,
            level: 2,
        });
        await clickByName(expectedCalculatorTab, "tab");

        expect(
            await screen.findByLabelText(expectedWorkerInputLabel, {
                selector: "input",
            }),
        ).toHaveValue(expectedWorkerValue);
    });
});

describe("target amount input rendering", () => {
    const expectedErrorMessage =
        "Invalid output item target, must be a positive non-zero whole number";

    test("renders an input to enter the target amount", async () => {
        render(<Calculator />);

        const input = await screen.findByLabelText(
            expectedTargetAmountInputLabel,
            {
                selector: "input",
            },
        );
        expect(input).toBeVisible();
        expect(input).toHaveValue("");
    });

    test("does not render an error message by default", async () => {
        render(<Calculator />);
        await screen.findByLabelText(expectedWorkerInputLabel, {
            selector: "input",
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    describe.each([
        ["negative", "-1"],
        ["zero", "0"],
        ["not a number", "test"],
        ["number with invalid character suffix", "3-test"],
    ])(
        "renders invalid input message if amount is %s",
        (_: string, input: string) => {
            test("renders invalid target amount message", async () => {
                render(<Calculator />);
                await selectItemAndTarget({
                    itemName: item.name,
                    amount: input,
                });

                expect(await screen.findByRole("alert")).toHaveTextContent(
                    expectedErrorMessage,
                );
            });

            test("does not render the requirements section", async () => {
                render(<Calculator />);
                await selectItemAndTarget({
                    itemName: item.name,
                    workers: input,
                });
                await screen.findByRole("alert");

                expect(
                    screen.queryByRole("heading", {
                        name: expectedRequirementsHeading,
                    }),
                ).not.toBeInTheDocument();
            });
        },
    );

    test("clears error message after changing input to a valid input", async () => {
        const invalidInput = "Invalid";
        const validInput = "1";

        render(<Calculator />);
        await selectItemAndTarget({
            itemName: item.name,
            amount: invalidInput,
        });
        await screen.findByRole("alert");
        await selectItemAndTarget({ amount: validInput, clear: true });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    test("renders clear button with correct label if input has value", async () => {
        render(<Calculator />);
        await selectItemAndTarget({
            amount: "1",
        });
        const inputContainer = (
            await screen.findByLabelText(expectedTargetAmountInputLabel, {
                selector: "input",
            })
        ).parentElement as HTMLElement;

        expect(
            await within(inputContainer).findByRole("button", {
                name: "Clear output item target",
            }),
        ).toBeVisible();
    });

    test("does not reset input after tab is changed", async () => {
        const expectedValue = "24";

        render(<Calculator />);
        await selectItemAndTarget({ amount: expectedValue });
        await clickByName(expectedSettingsTab, "tab");
        await screen.findByRole("heading", {
            name: expectedSettingsTabHeader,
            level: 2,
        });
        await clickByName(expectedCalculatorTab, "tab");

        expect(
            await screen.findByLabelText(expectedTargetAmountInputLabel, {
                selector: "input",
            }),
        ).toHaveValue(expectedValue);
    });
});

afterAll(() => {
    server.close();
});
