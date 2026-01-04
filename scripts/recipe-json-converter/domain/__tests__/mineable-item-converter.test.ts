import path from "path";
import { vi } from "vitest";

import { MineableItemConverterInputs } from "../../interfaces/mineable-item-converter";
import { convertMineableItems as baseConvertMineableItems } from "../mineable-item-converter";
import { DefaultToolset, MineableItems, UntranslatedItem } from "../../types";

const mockFindFiles = vi.fn();
const mockReadMineableItemsFile = vi.fn();

const convertMineableItems = (input: MineableItemConverterInputs) =>
    baseConvertMineableItems({
        ...input,
        findFiles: mockFindFiles,
        readMineableItemsFile: mockReadMineableItemsFile,
    });

const input: MineableItemConverterInputs = {
    inputDirectoryPath: path.join(__dirname, "/test"),
};

const mineableItemsFile = path.join(input.inputDirectoryPath, "/types.json");
const expectedMineableItemsFileFindInput = {
    root: input.inputDirectoryPath,
    exact: "types",
    fileExtension: ".json",
};

beforeEach(() => {
    mockFindFiles.mockResolvedValue([mineableItemsFile]);
    const defaultMineableItemsContent: MineableItems = {};
    mockReadMineableItemsFile.mockResolvedValue(defaultMineableItemsContent);
});

test("finds the mineable items file in the provided input directory", async () => {
    await convertMineableItems(input);

    expect(mockFindFiles).toHaveBeenCalledTimes(1);
    expect(mockFindFiles).toHaveBeenCalledWith(
        expectedMineableItemsFileFindInput,
    );
});

test.each([
    [
        "more than one mineable items files",
        [mineableItemsFile, mineableItemsFile],
        "Multiple types.json files found, ensure only one exists",
    ],
    [
        "no mineable item file",
        [],
        "No types.json file found in provided directory",
    ],
])(
    "throws an error if %s found",
    async (_: string, filesFound: string[], expectedError: string) => {
        mockFindFiles.mockResolvedValue(filesFound);

        expect.assertions(1);
        await expect(convertMineableItems(input)).rejects.toThrowError(
            expectedError,
        );
    },
);

test("parses the JSON found in the mineable items file", async () => {
    await convertMineableItems(input);

    expect(mockReadMineableItemsFile).toHaveBeenCalledTimes(1);
    expect(mockReadMineableItemsFile).toHaveBeenCalledWith(mineableItemsFile);
});

test.each([
    ["clay"],
    ["coalore"],
    ["copper"],
    ["goldore"],
    ["ironore"],
    ["leadore"],
    ["silicasand"],
    ["stonerubble"],
    ["sulfur"],
    ["tin"],
    ["zinc"],
])(
    "returns converted recipe given a single mineable item (%s) found in file",
    async (piplizID: string) => {
        const mineableItemsContent: MineableItems = {
            infinite: {
                customData: {
                    minerMiningTime: 20,
                },
                onRemoveType: piplizID,
            },
        };
        mockReadMineableItemsFile.mockResolvedValue(mineableItemsContent);
        const expected: UntranslatedItem = {
            id: piplizID,
            createTime: 20,
            output: 1,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            },
            creatorID: "minerjob",
        };

        const actual = await convertMineableItems(input);

        expect(actual).toHaveLength(1);
        expect(actual[0]).toEqual(expected);
    },
);

test("ignores non-mineable items found in mineable items file", async () => {
    const mineableItemsContent: MineableItems = {
        infinite: {
            customData: {
                minerMiningTime: 20,
            },
            onRemoveType: "clay",
        },
        nonMineable: { test: "test" },
    };
    mockReadMineableItemsFile.mockResolvedValue(mineableItemsContent);
    const expected: UntranslatedItem = {
        id: "clay",
        createTime: 20,
        output: 1,
        requires: [],
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.steel,
        },
        creatorID: "minerjob",
    };

    const actual = await convertMineableItems(input);

    expect(actual).toHaveLength(1);
    expect(actual[0]).toEqual(expected);
});

test("converts multiple items given multiple mineable items found in file", async () => {
    const mineableItemsContent: MineableItems = {
        infiniteClay: {
            customData: {
                minerMiningTime: 20,
            },
            onRemoveType: "clay",
        },
        infiniteZinc: {
            customData: {
                minerMiningTime: 50,
            },
            onRemoveType: "zinc",
        },
    };
    mockReadMineableItemsFile.mockResolvedValue(mineableItemsContent);
    const expected: UntranslatedItem[] = [
        {
            id: "clay",
            createTime: 20,
            output: 1,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            },
            creatorID: "minerjob",
        },
        {
            id: "zinc",
            createTime: 50,
            output: 1,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            },
            creatorID: "minerjob",
        },
    ];

    const actual = await convertMineableItems(input);

    expect(actual).toHaveLength(expected.length);
    expect(actual).toEqual(expect.arrayContaining(expected));
});

test("throws an error if more than one recipe for same mineable item", async () => {
    const sameItemName = "stonerubble";
    const expectedError = `Multiple mineable recipes for item: ${sameItemName}, please remove one`;
    const mineableItemsContent: MineableItems = {
        infinite: {
            customData: {
                minerMiningTime: 20,
            },
            onRemoveType: sameItemName,
        },
        infiniteTwo: {
            customData: {
                minerMiningTime: 20,
            },
            onRemoveType: sameItemName,
        },
    };
    mockReadMineableItemsFile.mockResolvedValue(mineableItemsContent);

    expect.assertions(1);
    await expect(convertMineableItems(input)).rejects.toThrowError(
        expectedError,
    );
});
