import path from "path";

import { RecipeConverterInputs } from "../../interfaces/recipe-converter";
import { convertRecipes as baseConvertRecipes } from "../recipe-converter";
import { APITools, Item, Items } from "../../types";

const mockConvertCrafteableRecipes = jest.fn();
const mockConvertMineableItems = jest.fn();
const mockConvertGrowables = jest.fn();
const mockWriteJSON = jest.fn();

const convertRecipes = (input: RecipeConverterInputs) =>
    baseConvertRecipes({
        ...input,
        convertCraftableRecipes: mockConvertCrafteableRecipes,
        convertMineableItems: mockConvertMineableItems,
        convertGrowables: mockConvertGrowables,
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

const expectedGrowables: Items = [
    {
        name: "Wheat",
        createTime: 20,
        output: 1,
        requires: [],
        minimumTool: APITools.none,
        maximumTool: APITools.none,
        creator: "Wheat farmer",
    },
];

const consoleLogSpy = jest
    .spyOn(console, "log")
    .mockImplementation(() => undefined);

beforeEach(() => {
    mockConvertCrafteableRecipes.mockResolvedValue(expectedCraftableRecipes);
    mockConvertMineableItems.mockResolvedValue(expectedMineableItems);
    mockConvertGrowables.mockResolvedValue(expectedGrowables);
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

test("converts all growable recipes in provided directory", async () => {
    await convertRecipes(input);

    expect(mockConvertGrowables).toHaveBeenCalledTimes(1);
    expect(mockConvertGrowables).toHaveBeenCalledWith({
        inputDirectoryPath: input.inputDirectoryPath,
    });
});

test("only writes returned craftable recipes to provided JSON output path if only craftable recipes returned", async () => {
    mockConvertMineableItems.mockResolvedValue([]);
    mockConvertGrowables.mockResolvedValue([]);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expectedCraftableRecipes
    );
});

test("only writes returned mineable items to provided JSON output path if only mineable items returned", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);
    mockConvertGrowables.mockResolvedValue([]);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expectedMineableItems
    );
});

test("only writes returned growable items to provided JSON output path if only growable items returned", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);
    mockConvertMineableItems.mockResolvedValue([]);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expectedGrowables
    );
});

test("writes combined recipes to provided JSON output path if both returned", async () => {
    const expected = [
        ...expectedCraftableRecipes,
        ...expectedMineableItems,
        ...expectedGrowables,
    ];

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expect.arrayContaining(expected)
    );
});

describe("handles directly non-creatable items", () => {
    const itemWithUnknownRequirement: Item = {
        name: "Test item",
        createTime: 2,
        requires: [{ name: "Unknown item", amount: 1 }],
        output: 1,
        minimumTool: APITools.none,
        maximumTool: APITools.steel,
        creator: "Test creator",
    };

    beforeEach(() => {
        mockConvertCrafteableRecipes.mockResolvedValue([
            itemWithUnknownRequirement,
        ]);
    });

    test("filters out any item that depends on an item that does not exist", async () => {
        await convertRecipes(input);

        expect(mockWriteJSON).not.toHaveBeenCalledWith(
            input.outputFilePath,
            expect.arrayContaining([itemWithUnknownRequirement])
        );
    });

    test("writes a message to console to indicate recipe removed", async () => {
        await convertRecipes(input);

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            `Removed recipe: ${itemWithUnknownRequirement.name} from ${itemWithUnknownRequirement.creator} as depends on item that cannot be created`
        );
    });
});

describe("handles non-creatable items due to nested unknown item", () => {
    const itemWithUnknownRequirement: Item = {
        name: "Test item",
        createTime: 2,
        requires: [{ name: "Unknown item", amount: 1 }],
        output: 1,
        minimumTool: APITools.none,
        maximumTool: APITools.steel,
        creator: "Test creator",
    };
    const itemWithNestedUnknownRequirement: Item = {
        name: "Another test item",
        createTime: 2,
        requires: [{ name: itemWithUnknownRequirement.name, amount: 1 }],
        output: 1,
        minimumTool: APITools.none,
        maximumTool: APITools.steel,
        creator: "Test creator",
    };

    beforeEach(() => {
        mockConvertCrafteableRecipes.mockResolvedValue([
            itemWithNestedUnknownRequirement,
            itemWithUnknownRequirement,
        ]);
    });

    test("filters out any item that depends on an item that does not exist", async () => {
        await convertRecipes(input);

        expect(mockWriteJSON).not.toHaveBeenCalledWith(
            input.outputFilePath,
            expect.arrayContaining([itemWithNestedUnknownRequirement])
        );
        expect(mockWriteJSON).not.toHaveBeenCalledWith(
            input.outputFilePath,
            expect.arrayContaining([itemWithUnknownRequirement])
        );
    });

    test("writes a message to console to indicate recipe removed", async () => {
        await convertRecipes(input);

        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            `Removed recipe: ${itemWithUnknownRequirement.name} from ${itemWithUnknownRequirement.creator} as depends on item that cannot be created`
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            `Removed recipe: ${itemWithNestedUnknownRequirement.name} from ${itemWithNestedUnknownRequirement.creator} as depends on item that cannot be created`
        );
    });
});

test("filters out any item that depends on an item that cannot be created because it depends on an item that does not exist", async () => {
    const itemWithUnknownRequirement: Item = {
        name: "Test item",
        createTime: 2,
        requires: [{ name: "Unknown item", amount: 1 }],
        output: 1,
        minimumTool: APITools.none,
        maximumTool: APITools.steel,
        creator: "Test creator",
    };
    const itemWithNestedUnknownRequirement: Item = {
        name: "Another test item",
        createTime: 2,
        requires: [{ name: itemWithUnknownRequirement.name, amount: 1 }],
        output: 1,
        minimumTool: APITools.none,
        maximumTool: APITools.steel,
        creator: "Test creator",
    };
    mockConvertCrafteableRecipes.mockResolvedValue([
        itemWithNestedUnknownRequirement,
        itemWithUnknownRequirement,
    ]);

    await convertRecipes(input);

    expect(mockWriteJSON).not.toHaveBeenCalledWith(
        input.outputFilePath,
        expect.arrayContaining([itemWithNestedUnknownRequirement])
    );
    expect(mockWriteJSON).not.toHaveBeenCalledWith(
        input.outputFilePath,
        expect.arrayContaining([itemWithUnknownRequirement])
    );
});

describe("handles no recipes converted", () => {
    beforeEach(() => {
        mockConvertCrafteableRecipes.mockResolvedValue([]);
        mockConvertMineableItems.mockResolvedValue([]);
        mockConvertGrowables.mockResolvedValue([]);
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
