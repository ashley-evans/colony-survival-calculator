import { screen, within } from "@testing-library/react";
import { HttpResponse, graphql } from "msw";
import { setupServer } from "msw/node";
import { vi } from "vitest";

import { renderWithRouterProvider } from "../../test/utils";
import {
    ItemName,
    expectedItemDetailsQueryName,
    expectedItemNameQueryName,
} from "../../pages/Calculator/__tests__/utils";

const EXPECTED_CALCULATOR_HEADER = "Desired output:";
const EXPECTED_CALCULATOR_ITEM_LABEL = "Item:";
const EXPECTED_CALCULATOR_WORKER_LABEL = "Output item workers:";
const EXPECTED_LOADING_MESSAGE = "Loading...";
const EXPECTED_APPLICATION_TITLE = "Colony Survival Calculator";
const EXPECTED_REPOSITORY_URL =
    "https://github.com/ashley-evans/colony-survival-calculator";
const EXPECTED_DARK_THEME_BUTTON_LABEL = "Change to dark theme";
const EXPECTED_LIGHT_THEME_BUTTON_LABEL = "Change to light theme";

const item: ItemName = { name: "Item 1" };

const server = setupServer(
    graphql.query(expectedItemNameQueryName, () => {
        return HttpResponse.json({ data: { distinctItemNames: [item.name] } });
    }),
    graphql.query(expectedItemDetailsQueryName, () => {
        return HttpResponse.json({ data: { item: [] } });
    }),
);

const mockMatchesMedia = vi.fn();

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: query === mockMatchesMedia(),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })),
});

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
    mockMatchesMedia.mockReturnValue("");
});

describe("root rendering", () => {
    test("renders a loading message while loading", async () => {
        renderWithRouterProvider();

        expect(screen.getByText(EXPECTED_LOADING_MESSAGE)).toBeVisible();
    });

    test("renders application header", async () => {
        renderWithRouterProvider();

        expect(
            await screen.findByRole("heading", {
                name: EXPECTED_APPLICATION_TITLE,
            }),
        ).toBeVisible();
    });

    test("renders a link to the Github repository inside banner", async () => {
        renderWithRouterProvider();
        const header = await screen.findByRole("heading", {
            name: EXPECTED_APPLICATION_TITLE,
        });
        const banner = header.parentElement as HTMLElement;
        const link = within(banner).getByRole("link", {
            name: "View the source code on GitHub",
        });

        expect(link).toHaveAttribute("href", EXPECTED_REPOSITORY_URL);
    });

    test("renders a button to change the theme inside the banner", async () => {
        renderWithRouterProvider();
        const header = await screen.findByRole("heading", {
            name: EXPECTED_APPLICATION_TITLE,
        });
        const banner = header.parentElement as HTMLElement;

        expect(
            within(banner).getByRole("button", {
                name: EXPECTED_LIGHT_THEME_BUTTON_LABEL,
            }),
        ).toBeVisible();
    });

    test("clicking the theme button toggles the theme", async () => {
        const { user } = renderWithRouterProvider();
        const header = await screen.findByRole("heading", {
            name: EXPECTED_APPLICATION_TITLE,
        });
        const banner = header.parentElement as HTMLElement;
        const themeButton = within(banner).getByRole("button", {
            name: EXPECTED_LIGHT_THEME_BUTTON_LABEL,
        });
        user.click(themeButton);

        expect(
            await within(banner).findByRole("button", {
                name: EXPECTED_DARK_THEME_BUTTON_LABEL,
            }),
        ).toBeVisible();

        user.click(themeButton);
        expect(
            await within(banner).findByRole("button", {
                name: EXPECTED_LIGHT_THEME_BUTTON_LABEL,
            }),
        ).toBeVisible();
    });

    test("renders the calculator", async () => {
        renderWithRouterProvider();

        expect(
            await screen.findByRole("combobox", {
                name: EXPECTED_CALCULATOR_ITEM_LABEL,
            }),
        ).toBeVisible();
        expect(
            screen.getByRole("heading", { name: EXPECTED_CALCULATOR_HEADER }),
        ).toBeVisible();
        expect(
            screen.getByLabelText(EXPECTED_CALCULATOR_WORKER_LABEL, {
                selector: "input",
            }),
        );
    });
});

describe("unknown path rendering", () => {
    const invalidPath = "/invalid";
    const expectedLinkText = "Return to calculator";

    test("renders a loading message while loading", async () => {
        renderWithRouterProvider({ defaultRoute: invalidPath });

        expect(screen.getByText(EXPECTED_LOADING_MESSAGE)).toBeVisible();
    });

    test("renders application header", async () => {
        renderWithRouterProvider({ defaultRoute: invalidPath });

        expect(
            await screen.findByRole("heading", {
                name: EXPECTED_APPLICATION_TITLE,
            }),
        ).toBeVisible();
    });

    test("renders a link to the Github repository inside banner", async () => {
        renderWithRouterProvider({ defaultRoute: invalidPath });
        const header = await screen.findByRole("heading", {
            name: EXPECTED_APPLICATION_TITLE,
        });
        const banner = header.parentElement as HTMLElement;
        const link = within(banner).getByRole("link");

        expect(link).toHaveAttribute("href", EXPECTED_REPOSITORY_URL);
    });

    test("renders a button to change the theme inside the banner", async () => {
        renderWithRouterProvider({ defaultRoute: invalidPath });
        const header = await screen.findByRole("heading", {
            name: EXPECTED_APPLICATION_TITLE,
        });
        const banner = header.parentElement as HTMLElement;

        expect(
            within(banner).getByRole("button", {
                name: EXPECTED_LIGHT_THEME_BUTTON_LABEL,
            }),
        ).toBeVisible();
    });

    test("renders a 404 message", async () => {
        const expectedMessage = "Oh no! You have gotten lost!";

        renderWithRouterProvider({ defaultRoute: invalidPath });

        expect(await screen.findByText(expectedMessage)).toBeVisible();
    });

    test("renders a link to return back to calculator", async () => {
        renderWithRouterProvider({ defaultRoute: invalidPath });

        expect(
            await screen.findByRole("link", { name: expectedLinkText }),
        ).toBeVisible();
    });

    test("pressing the link returns the user to the calculator", async () => {
        const { user } = renderWithRouterProvider({
            defaultRoute: invalidPath,
        });
        const button = await screen.findByRole("link", {
            name: expectedLinkText,
        });
        user.click(button);

        expect(
            await screen.findByRole("combobox", {
                name: EXPECTED_CALCULATOR_ITEM_LABEL,
            }),
        ).toBeVisible();
        expect(
            screen.getByRole("heading", { name: EXPECTED_CALCULATOR_HEADER }),
        ).toBeVisible();
        expect(
            screen.getByLabelText(EXPECTED_CALCULATOR_WORKER_LABEL, {
                selector: "input",
            }),
        );
    });
});

describe("theme preference handling", () => {
    test.each([
        ["dark", EXPECTED_LIGHT_THEME_BUTTON_LABEL],
        ["light", EXPECTED_DARK_THEME_BUTTON_LABEL],
    ])(
        `renders in %s theme given preference`,
        async (theme: string, expectedLabel: string) => {
            mockMatchesMedia.mockReturnValue(
                `(prefers-color-scheme: ${theme})`,
            );

            renderWithRouterProvider();
            const header = await screen.findByRole("heading", {
                name: EXPECTED_APPLICATION_TITLE,
            });
            const banner = header.parentElement as HTMLElement;

            expect(
                await within(banner).findByRole("button", {
                    name: expectedLabel,
                }),
            ).toBeVisible();
        },
    );
});
