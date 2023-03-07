import type { Items } from "../../../../types";
import { createItem } from "../../../../../test";

import { storeItem } from "../../adapters/store-item";

jest.mock("../../adapters/store-item", () => ({
    storeItem: jest.fn(),
}));

const mockStoreItem = storeItem as jest.Mock;

import { addItem } from "../add-item";

const validItem = createItem("item name 1", 2, 3, [], 10, 2);

beforeEach(() => {
    mockStoreItem.mockReset();
    mockStoreItem.mockResolvedValue(true);
});

describe.each([
    ["invalid JSON", "{ invalid JSON"],
    ["a non JSON array", JSON.stringify({})],
    [
        "an item with a missing name",
        JSON.stringify([
            {
                createTime: 2,
                output: 1,
                requires: [],
            },
        ]),
    ],
    [
        "an item with missing creation time",
        JSON.stringify([
            {
                name: "test",
                output: 1,
                requires: [],
            },
        ]),
    ],
    [
        "an item with non-numeric creation time",
        JSON.stringify([
            {
                name: "test",
                createTime: "test",
                output: 1,
                requires: [],
            },
        ]),
    ],
    [
        "an item with negative creation time",
        JSON.stringify([
            {
                name: "test",
                createTime: -1,
                output: 1,
                requires: [],
            },
        ]),
    ],
    [
        "an item with missing output amount",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                requires: [],
            },
        ]),
    ],
    [
        "an item with non-numeric output amount",
        JSON.stringify([
            {
                name: "test",
                createTime: 1,
                output: "test",
                requires: [],
            },
        ]),
    ],
    [
        "an item with negative output amount",
        JSON.stringify([
            {
                name: "test",
                createTime: 1,
                output: -1,
                requires: [],
            },
        ]),
    ],
    [
        "an item with missing requirements array",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
            },
        ]),
    ],
    [
        "an item with non-array requirements",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: "test",
            },
        ]),
    ],
    [
        "an item with a non-object requirement",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: ["test"],
            },
        ]),
    ],
    [
        "an item with a requirement that is missing a name",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [{ amount: 1 }],
            },
        ]),
    ],
    [
        "an item with a requirement that is missing requirement amount",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [{ name: "wibble" }],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
            },
        ]),
    ],
    [
        "an item with a requirement that has a non-numeric requirement amount",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [{ name: "wibble", amount: "test" }],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
            },
        ]),
    ],
    [
        "an item with non-object farm size",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: "wibble",
            },
        ]),
    ],
    [
        "an item with farm size that is missing a width",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    height: 1,
                },
            },
        ]),
    ],
    [
        "an item with farm size that has a non-numeric width",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: "test",
                    height: 1,
                },
            },
        ]),
    ],
    [
        "an item with farm size that is missing a height",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                },
            },
        ]),
    ],
    [
        "an item with farm size that has a non-numeric height",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: "test",
                },
            },
        ]),
    ],
])(
    "handles invalid input (schema validation) given %s",
    (_: string, input: string) => {
        beforeAll(() => {
            jest.spyOn(console, "error").mockImplementation(() => undefined);
        });

        test("does not store any items in database", async () => {
            try {
                await addItem(input);
            } catch {
                // Ignore
            }

            expect(storeItem).not.toHaveBeenCalled();
        });

        test("throws a validation error", async () => {
            const expectedError = "Validation Error:";

            expect.assertions(1);
            await expect(addItem(input)).rejects.toEqual(
                expect.stringContaining(expectedError)
            );
        });
    }
);

describe("handles valid input with a single item", () => {
    const expected: Items = [validItem];
    const input = JSON.stringify(expected);

    test("stores provided item in database", async () => {
        await addItem(input);

        expect(mockStoreItem).toHaveBeenCalledTimes(1);
        expect(mockStoreItem).toHaveBeenCalledWith(expected);
    });

    test("returns success", async () => {
        const actual = await addItem(input);

        expect(actual).toBe(true);
    });
});
