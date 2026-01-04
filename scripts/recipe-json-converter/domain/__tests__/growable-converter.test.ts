import path from "path";
import { vi } from "vitest";

import { GrowableConverterInputs } from "../../interfaces/growable-converter";
import { convertGrowables as baseConvertGrowables } from "../growable-converter";
import { DefaultToolset, Growables, UntranslatedItem } from "../../types";

const mockFindFiles = vi.fn();
const mockReadGrowablesFile = vi.fn();

const convertGrowables = (input: GrowableConverterInputs) =>
    baseConvertGrowables({
        ...input,
        findFiles: mockFindFiles,
        readGrowablesFile: mockReadGrowablesFile,
    });

const input: GrowableConverterInputs = {
    inputDirectoryPath: path.join(__dirname, "/test"),
};

const growablesFile = path.join(input.inputDirectoryPath, "/growables.json");
const expectedGrowablesFileFindInput = {
    root: input.inputDirectoryPath,
    exact: "growables",
    fileExtension: ".json",
};

const expectedStaticLogRecipe: UntranslatedItem = {
    id: "log",
    createTime: 435,
    output: 44,
    requires: [],
    // Setting at 59.4 (11 Trees, 9 Leaves, 0.6 chance - Setting specific as base recipes cannot support likelihood)
    optionalOutputs: [{ id: "leaves", amount: 59.4, likelihood: 1 }],
    toolset: {
        type: "default",
        minimumTool: DefaultToolset.none,
        maximumTool: DefaultToolset.none,
    },
    creatorID: "forester",
    size: {
        width: 3,
        height: 33,
    },
};

const expectedStaticLeavesRecipe: UntranslatedItem = {
    id: "leaves",
    createTime: 435,
    // Setting at 59.4 (11 Trees, 9 Leaves, 0.6 chance - Setting specific as base recipes cannot support likelihood)
    output: 59.4,
    requires: [],
    optionalOutputs: [{ id: "log", amount: 44, likelihood: 1 }],
    toolset: {
        type: "default",
        minimumTool: DefaultToolset.none,
        maximumTool: DefaultToolset.none,
    },
    creatorID: "forester",
    size: {
        width: 3,
        height: 33,
    },
};

const expectedStaticRecipes = [
    expectedStaticLogRecipe,
    expectedStaticLeavesRecipe,
];

beforeEach(() => {
    mockFindFiles.mockResolvedValue([growablesFile]);
    const defaultGrowablesFileContent: Growables = [];
    mockReadGrowablesFile.mockResolvedValue(defaultGrowablesFileContent);
});

test("finds the growables file in the provided input directory", async () => {
    await convertGrowables(input);

    expect(mockFindFiles).toHaveBeenCalledTimes(1);
    expect(mockFindFiles).toHaveBeenCalledWith(expectedGrowablesFileFindInput);
});

test.each([
    [
        "more than one growables files",
        [growablesFile, growablesFile],
        "Multiple growables.json files found, ensure only one exists",
    ],
    [
        "no growables file",
        [],
        "No growables.json file found in provided directory",
    ],
])(
    "throws an error if %s found",
    async (_: string, filesFound: string[], expectedError: string) => {
        mockFindFiles.mockResolvedValue(filesFound);

        expect.assertions(1);
        await expect(convertGrowables(input)).rejects.toThrowError(
            expectedError,
        );
    },
);

test("parses the JSON found in the growables file", async () => {
    await convertGrowables(input);

    expect(mockReadGrowablesFile).toHaveBeenCalledTimes(1);
    expect(mockReadGrowablesFile).toHaveBeenCalledWith(growablesFile);
});

test("always includes static log and leaves recipe regardless of whether included in recipes files", async () => {
    const actual = await convertGrowables(input);

    expect(actual).toHaveLength(2);
    expect(actual).toEqual(expect.arrayContaining(expectedStaticRecipes));
});

test.each([
    ["wheat", "wheatfarmer", 100, { height: 10, width: 10 }],
    ["flax", "flaxfarmer", 100, { height: 10, width: 10 }],
    ["cotton", "cottonfarmer", 100, { height: 10, width: 10 }],
    ["cabbage", "cabbagefarmer", 100, { height: 10, width: 10 }],
    ["alkanet", "alkanetfarmer", 100, { height: 10, width: 10 }],
    ["hollyhock", "hollyhockfarmer", 100, { height: 10, width: 10 }],
    ["wolfsbane", "wolfsbanefarmer", 100, { height: 10, width: 10 }],
    ["barley", "barleyfarmer", 100, { height: 10, width: 10 }],
    ["hemp", "hempfarmer", 100, { height: 10, width: 10 }],
    ["wisteriaflower", "wisteriafarmer", 1, null],
])(
    "returns converted recipe given single growable (%s) found in file (2 stages)",
    async (
        piplizID: string,
        expectedCreatorID: string,
        expectedOutput: number,
        expectedSize: { height: number; width: number } | null,
    ) => {
        const growables: Growables = [
            { identifier: piplizID, stages: [{}, {}] },
        ];
        mockReadGrowablesFile.mockResolvedValue(growables);
        const expected: UntranslatedItem = {
            id: piplizID,
            createTime: 435,
            output: expectedOutput,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.none,
            },
            creatorID: expectedCreatorID,
            ...(expectedSize ? { size: expectedSize } : {}),
        };

        const actual = await convertGrowables(input);

        expect(actual).toHaveLength(1 + expectedStaticRecipes.length);
        expect(actual).toContainEqual(expected);
    },
);

test("returns converted recipe given single growable with more than 2 stages", async () => {
    const growables: Growables = [
        { identifier: "wheat", stages: [{}, {}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);
    const expected: UntranslatedItem = {
        id: "wheat",
        createTime: 870,
        output: 100,
        requires: [],
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.none,
        },
        creatorID: "wheatfarmer",
        size: {
            width: 10,
            height: 10,
        },
    };

    const actual = await convertGrowables(input);

    expect(actual).toHaveLength(1 + expectedStaticRecipes.length);
    expect(actual).toContainEqual(expected);
});

test("throws an error if provided growable with unknown creator ID", async () => {
    const unknownCreator = "woodfloor";
    const growables: Growables = [
        { identifier: unknownCreator, stages: [{}, {}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);

    expect.assertions(1);
    await expect(convertGrowables(input)).rejects.toThrowError(
        `Creator ID unavailable for growable: ${unknownCreator}`,
    );
});

test("throws an error if provided growable has less than one growth day", async () => {
    const lessThanMinGrowth = "wheat";
    const growables: Growables = [
        { identifier: lessThanMinGrowth, stages: [{}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);

    expect.assertions(1);
    await expect(convertGrowables(input)).rejects.toThrowError(
        `Provided growable: ${lessThanMinGrowth} grows in less than one day`,
    );
});

test("converts multiple items given multiple growables found in file", async () => {
    const growables: Growables = [
        { identifier: "wheat", stages: [{}, {}, {}] },
        { identifier: "flax", stages: [{}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);
    const expected: UntranslatedItem[] = [
        {
            id: "wheat",
            createTime: 870,
            output: 100,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.none,
            },
            creatorID: "wheatfarmer",
            size: {
                width: 10,
                height: 10,
            },
        },
        {
            id: "flax",
            createTime: 435,
            output: 100,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.none,
            },
            creatorID: "flaxfarmer",
            size: {
                width: 10,
                height: 10,
            },
        },
    ];

    const actual = await convertGrowables(input);

    expect(actual).toHaveLength(expected.length + expectedStaticRecipes.length);
    expect(actual).toEqual(expect.arrayContaining(expected));
});

test("throws an error if more than one recipe for same growable item", async () => {
    const sameItemName = "wheat";
    const expectedError = `Multiple growable recipes for item: ${sameItemName}, please remove one`;
    const growables: Growables = [
        { identifier: sameItemName, stages: [{}, {}, {}] },
        { identifier: sameItemName, stages: [{}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);

    expect.assertions(1);
    await expect(convertGrowables(input)).rejects.toThrowError(expectedError);
});
