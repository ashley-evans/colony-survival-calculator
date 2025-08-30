import { Items, Item, DefaultToolset, MachineToolset } from "../../../../types";
import {
    createItem,
    createItemWithMachineTools,
    createOptionalOutput,
} from "../../../../../test";

import { storeItem } from "../../adapters/store-item";

jest.mock("../../adapters/store-item", () => ({
    storeItem: jest.fn(),
}));

const mockStoreItem = storeItem as jest.Mock;

import { addItem } from "../add-item";

const validItem = createItem({
    name: "item name 1",
    createTime: 2,
    output: 3,
    requirements: [],
    minimumTool: DefaultToolset.none,
    maximumTool: DefaultToolset.none,
    width: 10,
    height: 2,
});
const validItemWithReqs = createItem({
    name: "item name 2",
    createTime: 1,
    output: 2,
    requirements: [{ name: "item name 1", amount: 2 }],
    minimumTool: DefaultToolset.none,
    maximumTool: DefaultToolset.none,
});
const validItemWithOptionalOutputs = createItem({
    name: "test item",
    createTime: 1,
    output: 1,
    requirements: [],
    optionalOutputs: [
        createOptionalOutput({
            name: "item name 1",
            amount: 1,
            likelihood: 0.5,
        }),
    ],
});
const validItemWithMachineTools = createItemWithMachineTools({
    name: "test item w/ machine tools",
    createTime: 5,
    output: 2,
    requirements: [],
});

const validItems = [
    validItem,
    validItemWithReqs,
    validItemWithOptionalOutputs,
    validItemWithMachineTools,
];

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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with a missing toolset",
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
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an missing toolset type",
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
                toolset: {
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an unknown toolset type",
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
                toolset: {
                    type: "unknown",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with a toolset with an missing minimum tool",
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
                toolset: {
                    type: "default",
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with a toolset with an unknown minimum tool",
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
                toolset: {
                    type: "default",
                    minimumTool: "unknown",
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with a toolset with an missing maximum tool",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with a toolset with an unknown maximum tool",
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
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: "unknown",
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that is missing a name",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        amount: 1,
                        likelihood: 0.5,
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that is missing an output amount",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        name: "wibble",
                        likelihood: 0.5,
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that has a non-numeric output amount",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        name: "wibble",
                        amount: "test",
                        likelihood: 0.5,
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that has an output amount less than one",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        name: "wibble",
                        amount: 0,
                        likelihood: 0.5,
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that is missing an output likelihood",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        name: "wibble",
                        amount: 5,
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that has a non-numeric output likelihood",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        name: "wibble",
                        amount: 2,
                        likelihood: "test",
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that has output likelihood less than zero",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        name: "wibble",
                        amount: 2,
                        likelihood: -1,
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that has output likelihood equal to zero",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        name: "wibble",
                        amount: 2,
                        likelihood: 0,
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with an optional output that has output likelihood greater than one",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
                optionalOutputs: [
                    {
                        name: "wibble",
                        amount: 2,
                        likelihood: 2,
                    },
                ],
            },
            {
                name: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: "test creator",
            },
        ]),
    ],
    [
        "an item with a missing creator name",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
            },
        ]),
    ],
    [
        "an item with a invalid creator name",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creator: 1,
            },
        ]),
    ],
    [
        "an item with specified machine tools but invalid minimum tool",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "machine",
                    minimumTool: DefaultToolset.none,
                    maximumTool: MachineToolset.machine,
                },
                creator: 1,
            },
        ]),
    ],
    [
        "an item with specified machine tools but invalid maximum tool",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "machine",
                    minimumTool: MachineToolset.machine,
                    maximumTool: DefaultToolset.none,
                },
                creator: 1,
            },
        ]),
    ],
    [
        "an item with specified default tools but machine tools specified as minimum",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: MachineToolset.machine,
                    maximumTool: DefaultToolset.none,
                },
                creator: 1,
            },
        ]),
    ],
    [
        "an item with specified default tools but machine tools specified as maximum",
        JSON.stringify([
            {
                name: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: MachineToolset.machine,
                },
                creator: 1,
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
            expect.assertions(1);
            await expect(addItem(input)).rejects.toMatchSnapshot();
        });
    },
);

describe.each([
    [
        "unknown item requirements",
        validItemWithReqs,
        "Missing requirement: item name 1 in item name 2",
    ],
    [
        "unknown optional output item",
        createItem({
            name: "test item",
            createTime: 1,
            output: 1,
            requirements: [],
            optionalOutputs: [
                createOptionalOutput({
                    name: "test optional item",
                    amount: 1,
                    likelihood: 0.5,
                }),
            ],
        }),
        "Missing optional output: test optional item in test item",
    ],
    [
        "invalid min/max tool combination (none above stone)",
        createItem({
            name: "test item",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: DefaultToolset.stone,
            maximumTool: DefaultToolset.none,
        }),
        "Invalid item: test item, minimum tool is better than maximum tool",
    ],
    [
        "invalid min/max tool combination (stone above copper)",
        createItem({
            name: "test item",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: DefaultToolset.copper,
            maximumTool: DefaultToolset.stone,
        }),
        "Invalid item: test item, minimum tool is better than maximum tool",
    ],
    [
        "invalid min/max tool combination (copper above iron)",
        createItem({
            name: "test item",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: DefaultToolset.iron,
            maximumTool: DefaultToolset.copper,
        }),
        "Invalid item: test item, minimum tool is better than maximum tool",
    ],
    [
        "invalid min/max tool combination (iron above bronze)",
        createItem({
            name: "test item",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: DefaultToolset.bronze,
            maximumTool: DefaultToolset.iron,
        }),
        "Invalid item: test item, minimum tool is better than maximum tool",
    ],
    [
        "invalid min/max tool combination (bronze above steel)",
        createItem({
            name: "test item",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: DefaultToolset.steel,
            maximumTool: DefaultToolset.bronze,
        }),
        "Invalid item: test item, minimum tool is better than maximum tool",
    ],
])("handles item with %s", (_: string, item: Item, expectedError: string) => {
    const input = JSON.stringify([item]);

    test("does not store any items in database", async () => {
        try {
            await addItem(input);
        } catch {
            // Ignore
        }

        expect(storeItem).not.toHaveBeenCalled();
    });

    test("throws a validation error", async () => {
        expect.assertions(1);
        await expect(addItem(input)).rejects.toThrowError(expectedError);
    });
});

describe("duplicate item and creator name combination handling", () => {
    const itemName = "test item";
    const creatorName = "test creator";
    const items: Items = [
        createItem({
            name: itemName,
            createTime: 2,
            output: 1,
            requirements: [],
            creator: creatorName,
        }),
        createItem({
            name: itemName,
            createTime: 4,
            output: 2,
            requirements: [],
            creator: "different creator",
        }),
        createItem({
            name: itemName,
            createTime: 4,
            output: 2,
            requirements: [],
            creator: creatorName,
        }),
        createItem({
            name: "another item",
            createTime: 1,
            output: 3,
            requirements: [],
        }),
    ];
    const input = JSON.stringify(items);
    const expectedError = `Items provided with same name: ${itemName} and creator: ${creatorName}`;

    test("does not store any items in database", async () => {
        try {
            await addItem(input);
        } catch {
            // Ignore
        }

        expect(storeItem).not.toHaveBeenCalled();
    });

    test("throws a validation error", async () => {
        expect.assertions(1);
        await expect(addItem(input)).rejects.toThrowError(expectedError);
    });
});

describe.each([
    ["a single item with default tools", [validItem]],
    ["multiple items with a mix of tools", validItems],
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
