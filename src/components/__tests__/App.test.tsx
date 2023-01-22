import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";

import { waitForRequest } from "../../helpers/utils";
import App from "../App";
import { Item, Items } from "../../types";

const ITEM_SELECT_LABEL = "Item:";
const WORKERS_INPUT_LABEL = "Workers:";
const STATIC_ITEMS_PATH = "json/items.json";

const VALID_FARM_ABLES: Required<Item>[] = [
    {
        name: "Test Farmable 1",
        createTime: 5,
        output: 10,
        size: { width: 10, height: 10 },
    },
];
const CRAFT_ABLE_ITEMS: Items = [
    { name: "Test Item 1", createTime: 2, output: 1 },
    { name: "Test Item 2", createTime: 4, output: 1 },
];
const VALID_ITEMS: Items = [...CRAFT_ABLE_ITEMS, ...VALID_FARM_ABLES];

const server = setupServer(
    rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
        return res(ctx.json(VALID_ITEMS));
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
});

test("renders application header", async () => {
    const expectedHeader = "Colony Survival Calculator";

    render(<App />);

    expect(
        await screen.findByRole("heading", { name: expectedHeader })
    ).toBeVisible();
});

describe("output selector", () => {
    test("fetches all known static items", async () => {
        const expectedRequest = waitForRequest(
            server,
            "GET",
            STATIC_ITEMS_PATH
        );

        render(<App />);

        await expect(expectedRequest).resolves.not.toThrowError();
    });

    test("renders desired output header", async () => {
        const expectedHeader = "Desired output:";

        render(<App />);

        expect(
            await screen.findByRole("heading", { name: expectedHeader })
        ).toBeVisible();
    });

    describe.each([
        ["no static items returned", []],
        ["invalid static items returned", [{ invalid: "invalid" }]],
    ])("given %s", (_: string, items) => {
        beforeEach(() => {
            server.use(
                rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
                    return res(ctx.json(items));
                })
            );
        });

        test("renders a missing items error", async () => {
            const expectedError = "Error: Unable to fetch known items";

            render(<App />);

            expect(await screen.findByRole("alert")).toHaveTextContent(
                expectedError
            );
        });

        test("does not render a combo box for the desired output", () => {
            const expectedLabel = "Item:";

            render(<App />);

            expect(
                screen.queryByRole("combobox", { name: expectedLabel })
            ).not.toBeInTheDocument();
        });

        test("does not render a worker input box", () => {
            const expectedLabel = "Workers:";

            render(<App />);

            expect(
                screen.queryByLabelText(expectedLabel, {
                    selector: "input",
                })
            ).not.toBeInTheDocument();
        });
    });

    test("does not render a missing known items if static items are returned", async () => {
        const expectedRequest = waitForRequest(
            server,
            "GET",
            STATIC_ITEMS_PATH
        );
        const errorMessage = "Error: Unable to fetch known items";

        render(<App />);
        await waitFor(() => expectedRequest);

        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    test("renders a select for the desired output selector if static items exist", async () => {
        const expectedLabel = "Item:";

        render(<App />);

        expect(
            await screen.findByRole("combobox", { name: expectedLabel })
        ).toBeVisible();
    });

    test("renders each item returned as an option in the combo box", async () => {
        render(<App />);
        await screen.findByRole("combobox", { name: ITEM_SELECT_LABEL });

        for (const expected of VALID_ITEMS) {
            expect(
                screen.getByRole("option", { name: expected.name })
            ).toBeInTheDocument();
        }
    });

    test("renders the first option in the list as selected by default", async () => {
        render(<App />);

        expect(
            await screen.findByRole("option", {
                name: VALID_ITEMS[0].name,
                selected: true,
            })
        ).toBeInTheDocument();
    });

    describe("worker input rendering", () => {
        const expectedErrorMessage =
            "Error: Invalid input, must be a positive number";

        test("renders an input to enter the number of workers", async () => {
            render(<App />);

            expect(
                await screen.findByLabelText(WORKERS_INPUT_LABEL, {
                    selector: "input",
                })
            );
        });

        test("does not render an error message by default", async () => {
            render(<App />);
            await screen.findByLabelText(WORKERS_INPUT_LABEL, {
                selector: "input",
            });

            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        });

        test.each([
            ["negative", "-1"],
            ["not a number", "test"],
        ])(
            "renders invalid workers message if workers is %s",
            async (_: string, input: string) => {
                const user = userEvent.setup();

                render(<App />);
                const workerInput = await screen.findByLabelText(
                    WORKERS_INPUT_LABEL,
                    {
                        selector: "input",
                    }
                );
                await user.type(workerInput, input);

                expect(await screen.findByRole("alert")).toHaveTextContent(
                    expectedErrorMessage
                );
            }
        );

        test("clears error message after changing input to a valid input", async () => {
            const invalidInput = "Invalid";
            const validInput = "1";
            const user = userEvent.setup();

            render(<App />);
            const workerInput = await screen.findByLabelText(
                WORKERS_INPUT_LABEL,
                {
                    selector: "input",
                }
            );
            await user.type(workerInput, invalidInput);
            await screen.findByRole("alert");
            await user.clear(workerInput);
            await user.type(workerInput, validInput);

            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        });
    });
});

describe("optimal output rendering", () => {
    const expectedOutputPrefix = "Optimal output:";

    test("does not render any output message by default", async () => {
        render(<App />);
        await screen.findByLabelText(WORKERS_INPUT_LABEL, {
            selector: "input",
        });

        expect(
            screen.queryByText(expectedOutputPrefix, { exact: false })
        ).not.toBeInTheDocument();
    });

    test("renders zero output given zero workers", async () => {
        const input = "0";
        const expectedOutput = "Optimal output: 0 per minute";
        const user = userEvent.setup();

        render(<App />);
        const workerInput = await screen.findByLabelText(WORKERS_INPUT_LABEL, {
            selector: "input",
        });
        await user.type(workerInput, input);

        expect(await screen.findByText(expectedOutput)).toBeVisible();
    });

    test.each([
        ["(whole)", "3", "90"],
        ["(float)", "3.5", "105"],
    ])(
        "renders the optimal output given %s workers and default item selected",
        async (_: string, input: string, expected: string) => {
            const expectedOutput = `Optimal output: ${expected} per minute`;
            const user = userEvent.setup();

            render(<App />);
            const workerInput = await screen.findByLabelText(
                WORKERS_INPUT_LABEL,
                {
                    selector: "input",
                }
            );
            await user.type(workerInput, input);

            expect(await screen.findByText(expectedOutput)).toBeVisible();
        }
    );

    test("renders the optimal output given multiple workers and non-default item selected", async () => {
        const input = "5";
        const expectedOutput = `Optimal output: 75 per minute`;
        const user = userEvent.setup();

        render(<App />);
        const workerInput = await screen.findByLabelText(WORKERS_INPUT_LABEL, {
            selector: "input",
        });
        await user.selectOptions(
            await screen.findByRole("combobox", {
                name: ITEM_SELECT_LABEL,
            }),
            VALID_ITEMS[1].name
        );
        await user.type(workerInput, input);

        expect(await screen.findByText(expectedOutput)).toBeVisible();
    });

    test("clears output if workers is changed to invalid number", async () => {
        const validInput = "3";
        const expectedOutput = "Optimal output: 90 per minute";
        const user = userEvent.setup();

        render(<App />);
        const workerInput = await screen.findByLabelText(WORKERS_INPUT_LABEL, {
            selector: "input",
        });
        await user.type(workerInput, validInput);
        await screen.findByText(expectedOutput);
        await user.clear(workerInput);

        expect(
            screen.queryByText(expectedOutputPrefix, { exact: false })
        ).not.toBeInTheDocument();
    });
});

describe("optimal farm size note rendering", () => {
    const expectedNotePrefix = "Calculations use optimal farm size:";

    test("renders the optimal height and width of the farm if provided", async () => {
        const farmable = VALID_FARM_ABLES[0];
        const expectedMessage = `${expectedNotePrefix} ${farmable.size.width} x ${farmable.size.height}`;
        const user = userEvent.setup();

        render(<App />);
        await user.selectOptions(
            await screen.findByRole("combobox", {
                name: ITEM_SELECT_LABEL,
            }),
            farmable.name
        );

        expect(await screen.findByText(expectedMessage)).toBeVisible();
    });

    test("does not render optimal farm size message if no size provided", async () => {
        const craft_able = CRAFT_ABLE_ITEMS[1];
        const user = userEvent.setup();

        render(<App />);
        await user.selectOptions(
            await screen.findByRole("combobox", {
                name: ITEM_SELECT_LABEL,
            }),
            craft_able.name
        );
        await screen.findByRole("combobox", { name: ITEM_SELECT_LABEL });

        expect(
            screen.queryByText(expectedNotePrefix, { exact: false })
        ).not.toBeInTheDocument();
    });
});

afterAll(() => {
    server.close();
});
