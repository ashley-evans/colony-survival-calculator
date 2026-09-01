import {
    Items,
    Item,
    DefaultToolset,
    MachineToolset,
    EyeglassesToolset,
} from "../../../../types";
import {
    createItem,
    createItemWithMachineTools,
    createOptionalOutput,
} from "../../../../../test";
import { vi, Mock } from "vitest";

import { storeItem } from "../../adapters/store-item";

vi.mock("../../adapters/store-item", () => ({
    storeItem: vi.fn(),
}));

const mockStoreItem = storeItem as Mock;

import { addItem } from "../add-item";

const validItem = createItem({
    id: "item1",
    createTime: 2,
    output: 3,
    requirements: [],
    minimumTool: "none" as DefaultToolset,
    maximumTool: "none" as DefaultToolset,
    width: 10,
    height: 2,
});
const validItemWithReqs = createItem({
    id: "item2",
    createTime: 1,
    output: 2,
    requirements: [{ id: "item1", amount: 2 }],
    minimumTool: "none" as DefaultToolset,
    maximumTool: "none" as DefaultToolset,
});
const validItemWithOptionalOutputs = createItem({
    id: "testitem",
    createTime: 1,
    output: 1,
    requirements: [],
    optionalOutputs: [
        createOptionalOutput({
            id: "item1",
            amount: 1,
            likelihood: 0.5,
        }),
    ],
});
const validItemWithMachineTools = createItemWithMachineTools({
    id: "testitemwithmachinetools",
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

const errorLogSpy = vi
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
        "an item with a missing id",
        JSON.stringify([
            {
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with missing creation time",
        JSON.stringify([
            {
                id: "test",
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with non-numeric creation time",
        JSON.stringify([
            {
                id: "test",
                createTime: "test",
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with negative creation time",
        JSON.stringify([
            {
                id: "test",
                createTime: -1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with missing output amount",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with non-numeric output amount",
        JSON.stringify([
            {
                id: "test",
                createTime: 1,
                output: "test",
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with negative output amount",
        JSON.stringify([
            {
                id: "test",
                createTime: 1,
                output: -1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with missing requirements array",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with non-array requirements",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: "test",
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a non-object requirement",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: ["test"],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a requirement that is missing an id",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [{ amount: 1 }],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a requirement that is missing requirement amount",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [{ id: "wibble" }],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a requirement that has a non-numeric requirement amount",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [{ id: "wibble", amount: "test" }],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with non-object farm size",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: "wibble",
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with farm size that is missing a width",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    height: 1,
                },
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with farm size that has a non-numeric width",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: "test",
                    height: 1,
                },
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with farm size that is missing a height",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                },
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with farm size that has a non-numeric height",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: "test",
                },
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a missing toolset",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: 1,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an missing toolset type",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: "test",
                },
                toolset: {
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an unknown toolset type",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: "test",
                },
                toolset: {
                    type: "unknown",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a toolset with an missing minimum tool",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: "test",
                },
                toolset: {
                    type: "default",
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a toolset with an unknown minimum tool",
        JSON.stringify([
            {
                id: "test",
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
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a toolset with an missing maximum tool",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: "test",
                },
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a toolset with an unknown maximum tool",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                size: {
                    width: 1,
                    height: "test",
                },
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "unknown",
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that is missing an id",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        amount: 1,
                        likelihood: 0.5,
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that is missing an output amount",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        id: "wibble",
                        likelihood: 0.5,
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that has a non-numeric output amount",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        id: "wibble",
                        amount: "test",
                        likelihood: 0.5,
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that has an output amount less than one",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        id: "wibble",
                        amount: 0,
                        likelihood: 0.5,
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that is missing an output likelihood",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        id: "wibble",
                        amount: 5,
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that has a non-numeric output likelihood",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        id: "wibble",
                        amount: 2,
                        likelihood: "test",
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that has output likelihood less than zero",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        id: "wibble",
                        amount: 2,
                        likelihood: -1,
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that has output likelihood equal to zero",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        id: "wibble",
                        amount: 2,
                        likelihood: 0,
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with an optional output that has output likelihood greater than one",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
                optionalOutputs: [
                    {
                        id: "wibble",
                        amount: 2,
                        likelihood: 2,
                    },
                ],
            },
            {
                id: "wibble",
                createTime: 1,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "wibble" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a missing creator ID",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with a invalid creator ID type",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: 1,
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with specified machine tools but invalid minimum tool",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "machine",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "machine" as MachineToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with specified machine tools but invalid maximum tool",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "machine",
                    minimumTool: "machine" as MachineToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with specified default tools but machine tools specified as minimum",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "machine" as MachineToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with specified default tools but machine tools specified as maximum",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "machine" as MachineToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with specified eyeglasses tools but invalid minimum tool",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "eyeglasses",
                    minimumTool: "machine" as MachineToolset,
                    maximumTool: "eyeglasses" as EyeglassesToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with specified eyeglasses tools but invalid maximum tool",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "eyeglasses",
                    minimumTool: "eyeglasses" as EyeglassesToolset,
                    maximumTool: "machine" as MachineToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with specified eyeglasses tools but minimum greater than maximum",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "eyeglasses",
                    minimumTool: "eyeglasses" as EyeglassesToolset,
                    maximumTool: "noglasses" as EyeglassesToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with non-object i18n",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: "test",
            },
        ]),
    ],
    [
        "an item with i18n missing name field",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    creator: { "en-US": "test creator" },
                },
            },
        ]),
    ],
    [
        "an item with i18n missing creator field",
        JSON.stringify([
            {
                id: "test",
                createTime: 2,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: "none" as DefaultToolset,
                    maximumTool: "none" as DefaultToolset,
                },
                creatorID: "testcreator",
                i18n: {
                    name: { "en-US": "test" },
                },
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
        "Missing requirement: item1 in item2",
    ],
    [
        "unknown optional output item",
        createItem({
            id: "testitem",
            createTime: 1,
            output: 1,
            requirements: [],
            optionalOutputs: [
                createOptionalOutput({
                    id: "testoptionalitem",
                    amount: 1,
                    likelihood: 0.5,
                }),
            ],
        }),
        "Missing optional output: testoptionalitem in testitem",
    ],
    [
        "invalid min/max tool combination (none above stone)",
        createItem({
            id: "testitem",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: "stone" as DefaultToolset,
            maximumTool: "none" as DefaultToolset,
        }),
        "Invalid item: testitem, minimum tool is better than maximum tool",
    ],
    [
        "invalid min/max tool combination (stone above copper)",
        createItem({
            id: "testitem",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: "copper" as DefaultToolset,
            maximumTool: "stone" as DefaultToolset,
        }),
        "Invalid item: testitem, minimum tool is better than maximum tool",
    ],
    [
        "invalid min/max tool combination (copper above iron)",
        createItem({
            id: "testitem",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: "iron" as DefaultToolset,
            maximumTool: "copper" as DefaultToolset,
        }),
        "Invalid item: testitem, minimum tool is better than maximum tool",
    ],
    [
        "invalid min/max tool combination (iron above bronze)",
        createItem({
            id: "testitem",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: "bronze" as DefaultToolset,
            maximumTool: "iron" as DefaultToolset,
        }),
        "Invalid item: testitem, minimum tool is better than maximum tool",
    ],
    [
        "invalid min/max tool combination (bronze above steel)",
        createItem({
            id: "testitem",
            createTime: 1,
            output: 2,
            requirements: [],
            minimumTool: "steel" as DefaultToolset,
            maximumTool: "bronze" as DefaultToolset,
        }),
        "Invalid item: testitem, minimum tool is better than maximum tool",
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
    const itemName = "testitem";
    const creatorName = "testcreator";
    const items: Items = [
        createItem({
            id: itemName,
            createTime: 2,
            output: 1,
            requirements: [],
            creatorID: creatorName,
        }),
        createItem({
            id: itemName,
            createTime: 4,
            output: 2,
            requirements: [],
            creatorID: "different creator",
        }),
        createItem({
            id: itemName,
            createTime: 4,
            output: 2,
            requirements: [],
            creatorID: creatorName,
        }),
        createItem({
            id: "anotheritem",
            createTime: 1,
            output: 3,
            requirements: [],
        }),
    ];
    const input = JSON.stringify(items);
    const expectedError = `Items provided with same id: ${itemName} and creator: ${creatorName}`;

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
