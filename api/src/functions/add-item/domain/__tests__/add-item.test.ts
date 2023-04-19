import { Items, Tools } from "../../../../types";
import { createItem } from "../../../../../test";

import { storeItem } from "../../adapters/store-item";

jest.mock("../../adapters/store-item", () => ({
    storeItem: jest.fn(),
}));

const mockStoreItem = storeItem as jest.Mock;

import { addItem } from "../add-item";

const validItem = createItem(
    "item name 1",
    2,
    3,
    [],
    Tools.none,
    Tools.none,
    10,
    2
);
const validItemWithReqs = createItem(
    "item name 2",
    1,
    2,
    [{ name: "item name 1", amount: 2 }],
    Tools.none,
    Tools.none
);
const validItems = [validItem, validItemWithReqs];

const errorLogSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

beforeEach(() => {
    mockStoreItem.mockReset();
    mockStoreItem.mockResolvedValue(true);

    errorLogSpy.mockClear();
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
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
                minimumTool: Tools.none,
                maximumTool: Tools.none,
            },
        ]),
    ],
    [
        "an item with a missing minimum tool",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: 1,
                },
                maximumTool: Tools.none,
            },
        ]),
    ],
    [
        "an item with an unknown minimum tool",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: 1,
                },
                minimumTool: "unknown",
                maximumTool: Tools.none,
            },
        ]),
    ],
    [
        "an item with a missing maximum tool",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: 1,
                },
                minimumTool: Tools.none,
            },
        ]),
    ],
    [
        "an item with an unknown maximum tool",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: 1,
                },
                minimumTool: Tools.none,
                maximumTool: "unknown",
            },
        ]),
    ],
])(
    "handles invalid input (schema validation) given %s",
    (_: string, input: string) => {
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

describe("handles items with unknown item requirements", () => {
    const items: Items = [validItemWithReqs];
    const input = JSON.stringify(items);

    test("does not store any items in database", async () => {
        try {
            await addItem(input);
        } catch {
            // Ignore
        }

        expect(storeItem).not.toHaveBeenCalled();
    });

    test("throws a validation error", async () => {
        const expectedError = "Missing requirement:";

        expect.assertions(1);
        await expect(addItem(input)).rejects.toEqual(
            expect.stringContaining(expectedError)
        );
    });
});

describe.each([
    ["a single item", [validItem]],
    ["multiple items", validItems],
])("handles valid input with %s", (_: string, expected: Items) => {
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

describe("error handling", () => {
    test("returns failure if the storage of items failed", async () => {
        const input = JSON.stringify(validItems);
        mockStoreItem.mockResolvedValue(false);

        const actual = await addItem(input);

        expect(actual).toBe(false);
    });

    test("throws an error if an unhandled exception is thrown while storing items", async () => {
        const input = JSON.stringify(validItems);
        const expectedError = new Error("test error");
        mockStoreItem.mockRejectedValue(expectedError);

        expect.assertions(1);
        await expect(addItem(input)).rejects.toEqual(expectedError);
    });

    test("logs the error message to console if an unhandled exception occurs while storing items", async () => {
        const input = JSON.stringify(validItems);
        const expectedError = new Error("test error");
        mockStoreItem.mockRejectedValue(expectedError);

        try {
            await addItem(input);
        } catch {
            // Ignore
        }

        expect(errorLogSpy).toHaveBeenCalledTimes(1);
        expect(errorLogSpy).toHaveBeenCalledWith(expectedError);
    });
});
