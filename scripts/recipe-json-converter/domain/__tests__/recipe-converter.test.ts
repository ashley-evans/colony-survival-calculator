import path from "path";
import { when } from "jest-when";

import { RecipeConverterInputs } from "../../interfaces/recipe-converter";
import { convertRecipes as baseConvertRecipes } from "../recipe-converter";

const mockFindFiles = jest.fn();
const mockReadToolFile = jest.fn();
const mockReadBehaviourFile = jest.fn();
const mockReadRecipeFile = jest.fn();

const convertRecipes = (input: RecipeConverterInputs) =>
    baseConvertRecipes({
        ...input,
        findFiles: mockFindFiles,
        readToolsFile: mockReadToolFile,
        readBehavioursFile: mockReadBehaviourFile,
        readRecipeFile: mockReadRecipeFile,
    });

const input: RecipeConverterInputs = {
    inputDirectoryPath: path.join(__dirname, "/test"),
    outputFilePath: path.join(__dirname, "/output.json"),
};

const toolsetFile = path.join(input.inputDirectoryPath, "/toolsets.json");
const blockBehavioursFile = path.join(
    input.inputDirectoryPath,
    "/generateblocks.json"
);
const recipeFiles = [
    path.join(input.inputDirectoryPath, "/recipes_1.json"),
    path.join(input.inputDirectoryPath, "/recipes_2.json"),
];

const expectedToolsetFileFindInput = {
    root: input.inputDirectoryPath,
    exact: "toolsets",
    fileExtension: ".json",
};
const expectedBlockBehavioursFileFindInput = {
    root: input.inputDirectoryPath,
    exact: "generateblocks",
    fileExtension: ".json",
};
const expectedRecipesFileFindInput = {
    root: input.inputDirectoryPath,
    prefix: "recipes_",
    fileExtension: ".json",
};

beforeEach(() => {
    when(mockFindFiles)
        .calledWith(expectedToolsetFileFindInput)
        .mockResolvedValue([toolsetFile]);
    when(mockFindFiles)
        .calledWith(expectedBlockBehavioursFileFindInput)
        .mockResolvedValue([blockBehavioursFile]);
    when(mockFindFiles)
        .calledWith(expectedRecipesFileFindInput)
        .mockResolvedValue(recipeFiles);
});

test("finds the toolset json file in the provided input directory", async () => {
    await convertRecipes(input);

    expect(mockFindFiles).toHaveBeenCalledTimes(3);
    expect(mockFindFiles).toHaveBeenNthCalledWith(
        1,
        expectedToolsetFileFindInput
    );
});

describe.each([
    [
        "more than one",
        ["toolsets.json", "toolsets.json"],
        "Multiple toolsets.json files found, ensure only one exists",
    ],
    ["no", [], "No toolsets.json file found in provided directory"],
])(
    "handles %s toolset file found",
    (_: string, filesFound: string[], expectedError: string) => {
        beforeEach(() => {
            when(mockFindFiles)
                .calledWith(expectedToolsetFileFindInput)
                .mockResolvedValue(filesFound);
        });

        test("throws an error", async () => {
            expect.assertions(1);
            await expect(convertRecipes(input)).rejects.toThrowError(
                expectedError
            );
        });

        test("does not attempt to find block behaviour file", async () => {
            try {
                await convertRecipes(input);
            } catch {
                // Expected
            }

            expect(mockFindFiles).not.toHaveBeenCalledWith(
                expectedBlockBehavioursFileFindInput
            );
        });

        test("does not attempt to find recipe files", async () => {
            try {
                await convertRecipes(input);
            } catch {
                // Expected
            }

            expect(mockFindFiles).not.toHaveBeenCalledWith(
                expectedRecipesFileFindInput
            );
        });
    }
);

test("parses the JSON found in the toolset file", async () => {
    await convertRecipes(input);

    expect(mockReadToolFile).toHaveBeenCalledTimes(1);
    expect(mockReadToolFile).toHaveBeenCalledWith(toolsetFile);
});

test("finds the block behaviours file in the provided input directory", async () => {
    await convertRecipes(input);

    expect(mockFindFiles).toHaveBeenCalledTimes(3);
    expect(mockFindFiles).toHaveBeenNthCalledWith(
        2,
        expectedBlockBehavioursFileFindInput
    );
});

describe.each([
    [
        "more than one",
        ["generateblocks.json", "generateblocks.json"],
        "Multiple generateblocks.json files found, ensure only one exists",
    ],
    ["no", [], "No generateblocks.json file found in provided directory"],
])(
    "handles %s block behaviour file found",
    (_: string, filesFound: string[], expectedError: string) => {
        beforeEach(() => {
            when(mockFindFiles)
                .calledWith(expectedBlockBehavioursFileFindInput)
                .mockResolvedValue(filesFound);
        });

        test("throws an error", async () => {
            expect.assertions(1);
            await expect(convertRecipes(input)).rejects.toThrowError(
                expectedError
            );
        });

        test("does not attempt to find recipe files", async () => {
            try {
                await convertRecipes(input);
            } catch {
                // Expected
            }

            expect(mockFindFiles).not.toHaveBeenCalledWith(
                expectedRecipesFileFindInput
            );
        });
    }
);

test("parses the JSON found in the block behaviour file", async () => {
    await convertRecipes(input);

    expect(mockReadBehaviourFile).toHaveBeenCalledTimes(1);
    expect(mockReadBehaviourFile).toHaveBeenCalledWith(blockBehavioursFile);
});

test("finds all .json files with the prefix recipes_ in the provided input directory", async () => {
    await convertRecipes(input);

    expect(mockFindFiles).toHaveBeenCalledTimes(3);
    expect(mockFindFiles).toHaveBeenNthCalledWith(3, {
        root: input.inputDirectoryPath,
        prefix: "recipes_",
        fileExtension: ".json",
    });
});

test("parses each json file returned given recipes found in provided directory", async () => {
    await convertRecipes(input);

    expect(mockReadRecipeFile).toHaveBeenCalledTimes(recipeFiles.length);
    for (const recipePath of recipeFiles) {
        expect(mockReadRecipeFile).toHaveBeenCalledWith(recipePath);
    }
});

test("does not attempt to parse any recipes from the merchant", async () => {
    when(mockFindFiles)
        .calledWith(expectedRecipesFileFindInput)
        .mockResolvedValue([
            path.join(input.inputDirectoryPath, "recipes_merchant.json"),
        ]);

    await convertRecipes(input);

    expect(mockReadRecipeFile).not.toHaveBeenCalled();
});

test("does not attempt to parse any recipes given no recipe files found in provided directory", async () => {
    when(mockFindFiles)
        .calledWith(expectedRecipesFileFindInput)
        .mockResolvedValue([]);

    await convertRecipes(input);

    expect(mockReadRecipeFile).not.toHaveBeenCalled();
});
