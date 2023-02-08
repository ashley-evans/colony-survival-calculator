import { screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";

import router from "../router";
import { renderWithRouterProvider } from "../../test/utils";
import { Items } from "../../types";
import { STATIC_ITEMS_PATH } from "../../utils";

const ITEMS: Items = [{ name: "Test Item 1", createTime: 2, output: 1 }];

const server = setupServer(
    rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
        return res(ctx.json(ITEMS));
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
});

describe("root rendering", () => {
    test("renders application header on the root page", async () => {
        const expectedHeader = "Colony Survival Calculator";

        renderWithRouterProvider({ router });

        expect(
            await screen.findByRole("heading", { name: expectedHeader })
        ).toBeVisible();
    });

    test("renders the calculator on the root page", async () => {
        const expectedHeader = "Desired output:";
        const expectedItemSelectionLabel = "Item:";
        const expectedWorkerInputLabel = "Workers:";

        renderWithRouterProvider({ router });

        expect(
            await screen.findByRole("combobox", {
                name: expectedItemSelectionLabel,
            })
        ).toBeVisible();
        expect(
            screen.getByRole("heading", { name: expectedHeader })
        ).toBeVisible();
        expect(
            screen.getByLabelText(expectedWorkerInputLabel, {
                selector: "input",
            })
        );
    });
});
