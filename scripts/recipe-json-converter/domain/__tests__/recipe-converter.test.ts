import path from "path";

import { RecipeConverterInputs } from "../../interfaces/recipe-converter";
import { convertRecipes as baseConvertRecipes } from "../recipe-converter";
import { APITools, Items } from "../../types";

const mockConvertCrafteableRecipes = jest.fn();
const mockWriteJSON = jest.fn();

const convertRecipes = (input: RecipeConverterInputs) =>
    baseConvertRecipes({
        ...input,
        convertCraftableRecipes: mockConvertCrafteableRecipes,
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

beforeEach(() => {
    mockConvertCrafteableRecipes.mockResolvedValue(expectedCraftableRecipes);
    mockWriteJSON.mockResolvedValue(true);
});

test("converts all craftable recipes in provided directory", async () => {
    await convertRecipes(input);

    expect(mockConvertCrafteableRecipes).toHaveBeenCalledTimes(1);
    expect(mockConvertCrafteableRecipes).toHaveBeenCalledWith({
        inputDirectoryPath: input.inputDirectoryPath,
    });
});

test("writes returned craftable recipes to provided JSON output path if recipes returned", async () => {
    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expectedCraftableRecipes
    );
});

describe("handles no recipes converted", () => {
    beforeEach(() => {
        mockConvertCrafteableRecipes.mockResolvedValue([]);
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
