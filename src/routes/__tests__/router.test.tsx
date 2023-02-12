import { screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";

import router from "../router";
import { renderWithRouterProvider } from "../../test/utils";
import { Items } from "../../types";
import { STATIC_ITEMS_PATH } from "../../utils";

const EXPECTED_CALCULATOR_HEADER = "Desired output:";
const EXPECTED_CALCULATOR_ITEM_LABEL = "Item:";
const EXPECTED_CALCULATOR_WORKER_LABEL = "Workers:";
const EXPECTED_LOADING_MESSAGE = "Loading...";
const ITEMS: Items = [
    { name: "Test Item 1", createTime: 2, output: 1, requires: [] },
];

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
    test("renders a loading message while loading", async () => {
        renderWithRouterProvider({ router });

        expect(screen.getByText(EXPECTED_LOADING_MESSAGE)).toBeVisible();
    });

    test("renders application header", async () => {
        const expectedHeader = "Colony Survival Calculator";

        renderWithRouterProvider({ router });

        expect(
            await screen.findByRole("heading", { name: expectedHeader })
        ).toBeVisible();
    });

    test("renders the calculator", async () => {
        renderWithRouterProvider({ router });

        expect(
            await screen.findByRole("combobox", {
                name: EXPECTED_CALCULATOR_ITEM_LABEL,
            })
        ).toBeVisible();
        expect(
            screen.getByRole("heading", { name: EXPECTED_CALCULATOR_HEADER })
        ).toBeVisible();
        expect(
            screen.getByLabelText(EXPECTED_CALCULATOR_WORKER_LABEL, {
                selector: "input",
            })
        );
    });
});

describe("unknown path rendering", () => {
    const invalidPath = "/invalid";
    const expectedLinkText = "Return to calculator";

    test("renders a loading message while loading", async () => {
        renderWithRouterProvider({ router }, invalidPath);

        expect(screen.getByText(EXPECTED_LOADING_MESSAGE)).toBeVisible();
    });

    test("renders application header", async () => {
        const expectedHeader = "Colony Survival Calculator";

        renderWithRouterProvider({ router }, invalidPath);

        expect(
            await screen.findByRole("heading", { name: expectedHeader })
        ).toBeVisible();
    });

    test("renders a 404 message", async () => {
        const expectedMessage = "Oh no! You have gotten lost!";

        renderWithRouterProvider({ router }, invalidPath);

        expect(await screen.findByText(expectedMessage)).toBeVisible();
    });

    test("renders a link to return back to calculator", async () => {
        renderWithRouterProvider({ router }, invalidPath);

        expect(
            await screen.findByRole("link", { name: expectedLinkText })
        ).toBeVisible();
    });

    test("pressing the link returns the user to the calculator", async () => {
        const { user } = renderWithRouterProvider({ router }, invalidPath);
        const button = await screen.findByRole("link", {
            name: expectedLinkText,
        });
        user.click(button);

        expect(
            await screen.findByRole("combobox", {
                name: EXPECTED_CALCULATOR_ITEM_LABEL,
            })
        ).toBeVisible();
        expect(
            screen.getByRole("heading", { name: EXPECTED_CALCULATOR_HEADER })
        ).toBeVisible();
        expect(
            screen.getByLabelText(EXPECTED_CALCULATOR_WORKER_LABEL, {
                selector: "input",
            })
        );
    });
});
