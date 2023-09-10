import path from "path";

import { RecipeConverterInputs } from "../../interfaces/recipe-converter";
import { convertRecipes as baseConvertRecipes } from "../recipe-converter";
import { APITools, Items } from "../../types";

const mockConvertCrafteableRecipes = jest.fn();
const mockConvertMineableItems = jest.fn();
const mockWriteJSON = jest.fn();

const convertRecipes = (input: RecipeConverterInputs) =>
    baseConvertRecipes({
        ...input,
        convertCraftableRecipes: mockConvertCrafteableRecipes,
        convertMineableItems: mockConvertMineableItems,
        writeJSON: mockWriteJSON,
    });

const input: RecipeConverterInputs = {
    inputDirectoryPath: path.join(__dirname, "/test"),
    outputFilePath: path.join(__dirname, "/test.json"),
};

const expectedCraftableRecipes: Items = [
    {
        name: "Poison dart",
        createTime: 15,
        output: 1,
        requires: [],
        minimumTool: APITools.none,
        maximumTool: APITools.none,
        creator: "Alchemist",
    },
    {
        name: "Gunpowder",
        createTime: 25,
        output: 1,
        requires: [],
        minimumTool: APITools.none,
        maximumTool: APITools.none,
        creator: "Alchemist",
    },
];

const expectedMineableItems: Items = [
    {
        name: "Gold ore",
        createTime: 20,
        output: 1,
        requires: [],
        minimumTool: APITools.none,
        maximumTool: APITools.steel,
        creator: "Miner",
    },
];

beforeEach(() => {
    mockConvertCrafteableRecipes.mockResolvedValue(expectedCraftableRecipes);
    mockConvertMineableItems.mockResolvedValue(expectedMineableItems);
    mockWriteJSON.mockResolvedValue(true);
});

test("converts all craftable recipes in provided directory", async () => {
    await convertRecipes(input);

    expect(mockConvertCrafteableRecipes).toHaveBeenCalledTimes(1);
    expect(mockConvertCrafteableRecipes).toHaveBeenCalledWith({
        inputDirectoryPath: input.inputDirectoryPath,
    });
});

test("converts all mineable recipes in provided directory", async () => {
    await convertRecipes(input);

    expect(mockConvertMineableItems).toHaveBeenCalledTimes(1);
    expect(mockConvertMineableItems).toHaveBeenCalledWith({
        inputDirectoryPath: input.inputDirectoryPath,
    });
});

test("only writes returned craftable recipes to provided JSON output path if only craftable recipes returned", async () => {
    mockConvertMineableItems.mockResolvedValue([]);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expectedCraftableRecipes
    );
});

test("only writes returned mineable items to provided JSON output path if only mineable items returned", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expectedMineableItems
    );
});

test("writes combined craftable recipes and mineable items to provided JSON output path if both returned", async () => {
    const expected = [...expectedCraftableRecipes, ...expectedMineableItems];

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expect.arrayContaining(expected)
    );
});

describe("handles no recipes converted", () => {
    beforeEach(() => {
        mockConvertCrafteableRecipes.mockResolvedValue([]);
        mockConvertMineableItems.mockResolvedValue([]);
    });

    test("does not write any files", async () => {
        await convertRecipes(input);

        expect(mockWriteJSON).not.toHaveBeenCalled();
    });

    test("returns failure", async () => {
        const actual = await convertRecipes(input);

        expect(actual).toEqual(false);
    });
});

test("returns success if JSON was written successfully", async () => {
    const actual = await convertRecipes(input);

    expect(actual).toEqual(true);
});

test("returns failure if JSON was not written successfully", async () => {
    mockWriteJSON.mockResolvedValue(false);

    const actual = await convertRecipes(input);

    expect(actual).toEqual(false);
});
