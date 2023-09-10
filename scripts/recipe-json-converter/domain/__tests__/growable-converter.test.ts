import path from "path";

import { GrowableConverterInputs } from "../../interfaces/growable-converter";
import { convertGrowables as baseConvertGrowables } from "../growable-converter";
import { APITools, Growables, Item, Items } from "../../types";

const mockFindFiles = jest.fn();
const mockReadGrowablesFile = jest.fn();

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
            expectedError
        );
    }
);

test("parses the JSON found in the growables file", async () => {
    await convertGrowables(input);

    expect(mockReadGrowablesFile).toHaveBeenCalledTimes(1);
    expect(mockReadGrowablesFile).toHaveBeenCalledWith(growablesFile);
});

test.each([
    ["wheat", "Wheat", "Wheat farmer", 100],
    ["flax", "Flax", "Flax farmer", 100],
    ["cotton", "Cotton", "Cotton farmer", 100],
    ["cabbage", "Cabbage", "Cabbage farmer", 100],
    ["alkanet", "Alkanet", "Alkanet farmer", 100],
    ["hollyhock", "Hollyhock", "Hollyhock farmer", 100],
    ["wolfsbane", "Wolfsbane", "Wolfsbane farmer", 100],
    ["barley", "Barley", "Barley farmer", 100],
    ["hemp", "Hemp", "Hemp farmer", 100],
    ["wisteriaplant", "Wisteria flower", "Wisteria flower farmer", 1],
])(
    "returns converted recipe given single growable (%s) found in file (2 stages)",
    async (
        piplizName: string,
        expectedName: string,
        expectedCreator: string,
        expectedOutput: number
    ) => {
        const growables: Growables = [
            { identifier: piplizName, stages: [{}, {}] },
        ];
        mockReadGrowablesFile.mockResolvedValue(growables);
        const expected: Item = {
            name: expectedName,
            createTime: 435,
            output: expectedOutput,
            requires: [],
            minimumTool: APITools.none,
            maximumTool: APITools.none,
            creator: expectedCreator,
        };

        const actual = await convertGrowables(input);

        expect(actual).toHaveLength(1);
        expect(actual[0]).toEqual(expected);
    }
);

test("returns converted recipe given single growable with more than 2 stages", async () => {
    const growables: Growables = [
        { identifier: "wheat", stages: [{}, {}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);
    const expected: Item = {
        name: "Wheat",
        createTime: 870,
        output: 100,
        requires: [],
        minimumTool: APITools.none,
        maximumTool: APITools.none,
        creator: "Wheat farmer",
    };

    const actual = await convertGrowables(input);

    expect(actual).toHaveLength(1);
    expect(actual[0]).toEqual(expected);
});

test("throws an error if provided growable with unknown user friendly name", async () => {
    const unknownName = "testname";
    const growables: Growables = [
        { identifier: unknownName, stages: [{}, {}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);

    expect.assertions(1);
    await expect(convertGrowables(input)).rejects.toThrowError(
        `User friendly name unavailable for growable: ${unknownName}`
    );
});

test("throws an error if provided growable with unknown user friendly creator name", async () => {
    const unknownCreator = "woodfloor";
    const growables: Growables = [
        { identifier: unknownCreator, stages: [{}, {}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);

    expect.assertions(1);
    await expect(convertGrowables(input)).rejects.toThrowError(
        `User friendly creator name unavailable for growable: ${unknownCreator}`
    );
});

test("throws an error if provided growable has unknown expected output", async () => {
    const unknownOutput = "jobblockcrafter";
    const growables: Growables = [
        { identifier: unknownOutput, stages: [{}, {}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);

    expect.assertions(1);
    await expect(convertGrowables(input)).rejects.toThrowError(
        `Expected output for growable: ${unknownOutput} not known`
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
        `Provided growable: ${lessThanMinGrowth} grows in less than one day`
    );
});

test("converts multiple items given multiple growables found in file", async () => {
    const growables: Growables = [
        { identifier: "wheat", stages: [{}, {}, {}] },
        { identifier: "flax", stages: [{}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);
    const expected: Items = [
        {
            name: "Wheat",
            createTime: 870,
            output: 100,
            requires: [],
            minimumTool: APITools.none,
            maximumTool: APITools.none,
            creator: "Wheat farmer",
        },
        {
            name: "Flax",
            createTime: 435,
            output: 100,
            requires: [],
            minimumTool: APITools.none,
            maximumTool: APITools.none,
            creator: "Flax farmer",
        },
    ];

    const actual = await convertGrowables(input);

    expect(actual).toHaveLength(expected.length);
    expect(actual).toEqual(expect.arrayContaining(expected));
});

test("throws an error if more than one recipe for same growable item", async () => {
    const sameItemName = "wheat";
    const expectedError = `Multiple growable recipes for item: Wheat, please remove one`;
    const growables: Growables = [
        { identifier: sameItemName, stages: [{}, {}, {}] },
        { identifier: sameItemName, stages: [{}, {}] },
    ];
    mockReadGrowablesFile.mockResolvedValue(growables);

    expect.assertions(1);
    await expect(convertGrowables(input)).rejects.toThrowError(expectedError);
});
