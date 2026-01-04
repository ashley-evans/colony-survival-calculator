import path from "path";
import { vi } from "vitest";
import { when } from "vitest-when";

import { CraftableRecipeConverterInputs } from "../../interfaces/craftable-recipe-converter";
import { convertRecipes as baseConvertRecipes } from "../craftable-recipe-converter";
import {
    BlockBehaviours,
    Recipes,
    PiplizTools,
    PiplizToolsets,
    DefaultToolset,
    UntranslatedItem,
    MachineToolset,
} from "../../types";

const mockFindFiles = vi.fn();
const mockReadToolFile = vi.fn();
const mockReadBehaviourFile = vi.fn();
const mockReadRecipeFile = vi.fn();

const convertRecipes = (input: CraftableRecipeConverterInputs) =>
    baseConvertRecipes({
        ...input,
        findFiles: mockFindFiles,
        readToolsFile: mockReadToolFile,
        readBehavioursFile: mockReadBehaviourFile,
        readRecipeFile: mockReadRecipeFile,
    });

const input: CraftableRecipeConverterInputs = {
    inputDirectoryPath: path.join(__dirname, "/test"),
};

const toolsetFile = path.join(input.inputDirectoryPath, "/toolsets.json");
const blockBehavioursFile = path.join(
    input.inputDirectoryPath,
    "/generateblocks.json",
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
    prefix: "generateblocks",
    fileExtension: ".json",
};
const expectedRecipesFileFindInput = {
    root: input.inputDirectoryPath,
    prefix: "recipes_",
    fileExtension: ".json",
};

const noToolset: PiplizToolsets[number] = {
    key: "notool",
    usable: [PiplizTools.notools],
};
const defaultToolset: PiplizToolsets[number] = {
    key: "default",
    usable: [
        PiplizTools.notools,
        PiplizTools.stonetools,
        PiplizTools.coppertools,
        PiplizTools.irontools,
        PiplizTools.bronzetools,
        PiplizTools.steeltools,
    ],
};
const glassesToolset: PiplizToolsets[number] = {
    key: "glasses",
    usable: [PiplizTools.notools, PiplizTools.eyeglasses],
};
const machineToolset: PiplizToolsets[number] = {
    key: "machinetools",
    usable: [PiplizTools.machinetools],
};

const consoleLogSpy = vi
    .spyOn(console, "log")
    .mockImplementation(() => undefined);

beforeEach(() => {
    when(mockFindFiles)
        .calledWith(expectedToolsetFileFindInput)
        .thenResolve([toolsetFile]);
    when(mockFindFiles)
        .calledWith(expectedBlockBehavioursFileFindInput)
        .thenResolve([blockBehavioursFile]);
    when(mockFindFiles)
        .calledWith(expectedRecipesFileFindInput)
        .thenResolve(recipeFiles);

    mockReadToolFile.mockResolvedValue([
        noToolset,
        defaultToolset,
        glassesToolset,
        machineToolset,
    ]);
    mockReadRecipeFile.mockResolvedValue([]);
    mockReadBehaviourFile.mockResolvedValue([]);
});

test("finds the toolset json file in the provided input directory", async () => {
    await convertRecipes(input);

    expect(mockFindFiles).toHaveBeenCalledTimes(3);
    expect(mockFindFiles).toHaveBeenNthCalledWith(
        1,
        expectedToolsetFileFindInput,
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
                .thenResolve(filesFound);
        });

        test("throws an error", async () => {
            expect.assertions(1);
            await expect(convertRecipes(input)).rejects.toThrowError(
                expectedError,
            );
        });

        test("does not attempt to find block behaviour file", async () => {
            try {
                await convertRecipes(input);
            } catch {
                // Expected
            }

            expect(mockFindFiles).not.toHaveBeenCalledWith(
                expectedBlockBehavioursFileFindInput,
            );
        });

        test("does not attempt to find recipe files", async () => {
            try {
                await convertRecipes(input);
            } catch {
                // Expected
            }

            expect(mockFindFiles).not.toHaveBeenCalledWith(
                expectedRecipesFileFindInput,
            );
        });
    },
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
        expectedBlockBehavioursFileFindInput,
    );
});

describe("handles no block behaviour file found", () => {
    beforeEach(() => {
        when(mockFindFiles)
            .calledWith(expectedBlockBehavioursFileFindInput)
            .thenResolve([]);
    });

    test("throws an error", async () => {
        expect.assertions(1);
        await expect(convertRecipes(input)).rejects.toThrowError(
            "No generateblocks*.json file(s) found in provided directory",
        );
    });

    test("does not attempt to find recipe files", async () => {
        try {
            await convertRecipes(input);
        } catch {
            // Expected
        }

        expect(mockFindFiles).not.toHaveBeenCalledWith(
            expectedRecipesFileFindInput,
        );
    });
});

test("parses each block behaviour file returned if multiple found", async () => {
    const expected = ["generateblocks.json", "generateblocks_decorative.json"];
    when(mockFindFiles)
        .calledWith(expectedBlockBehavioursFileFindInput)
        .thenResolve(expected);

    await convertRecipes(input);

    expect(mockReadBehaviourFile).toHaveBeenCalledTimes(expected.length);
    for (const file of expected) {
        expect(mockReadBehaviourFile).toHaveBeenCalledWith(file);
    }
});

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
        .thenResolve([
            path.join(input.inputDirectoryPath, "recipes_merchant.json"),
        ]);

    await convertRecipes(input);

    expect(mockReadRecipeFile).not.toHaveBeenCalled();
});

test("does not attempt to parse any recipes given no recipe files found in provided directory", async () => {
    when(mockFindFiles)
        .calledWith(expectedRecipesFileFindInput)
        .thenResolve([]);

    await convertRecipes(input);

    expect(mockReadRecipeFile).not.toHaveBeenCalled();
});

describe("recipe to item mapping", () => {
    beforeEach(() => {
        when(mockFindFiles)
            .calledWith(expectedRecipesFileFindInput)
            .thenResolve([recipeFiles[0]]);
    });

    test.each([
        ["default", undefined, 1],
        ["specified", 2, 2],
    ])(
        "returns converted recipe given a single recipe with no toolset and no requirements and %s output",
        async (
            _: string,
            specifiedOutput: number | undefined,
            expectedOutput: number,
        ) => {
            const creator = "alchemist";
            const output = "poisondart";
            const recipes: Recipes = [
                {
                    cooldown: 20,
                    name: `pipliz.${creator}.${output}`,
                    requires: [],
                    results: [
                        {
                            type: output,
                            ...(specifiedOutput
                                ? { amount: specifiedOutput }
                                : {}),
                        },
                    ],
                },
            ];
            mockReadRecipeFile.mockResolvedValue(recipes);
            const behaviours: BlockBehaviours = [
                {
                    baseType: {
                        attachBehaviour: [
                            {
                                npcType: `pipliz.${creator}`,
                                toolset: noToolset.key,
                            },
                        ],
                    },
                },
            ];
            mockReadBehaviourFile.mockResolvedValue(behaviours);
            const expected: UntranslatedItem = {
                id: output,
                createTime: 20,
                output: expectedOutput,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creatorID: creator,
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        },
    );

    test("throws an error if invalid toolset specified for provided creator", async () => {
        const invalidToolset = "magictools";
        const output = "poisondart";
        const creator = "alchemist";
        const recipes: Recipes = [
            {
                cooldown: 20,
                name: `pipliz.${creator}.${output}`,
                requires: [],
                results: [
                    {
                        type: output,
                    },
                ],
            },
        ];
        mockReadRecipeFile.mockResolvedValue(recipes);
        const behaviours: BlockBehaviours = [
            {
                baseType: {
                    attachBehaviour: [
                        {
                            npcType: `pipliz.${creator}`,
                            toolset: invalidToolset,
                        },
                    ],
                },
            },
        ];
        mockReadBehaviourFile.mockResolvedValue(behaviours);

        expect.assertions(1);
        await expect(convertRecipes(input)).rejects.toThrowError(
            `Unknown toolset: ${invalidToolset} required by ${creator}`,
        );
    });

    describe("handles items with no toolset specified", () => {
        const creator = "alchemist";
        const output = "poisondart";
        const recipes: Recipes = [
            {
                cooldown: 20,
                name: `pipliz.${creator}.${output}`,
                requires: [],
                results: [
                    {
                        type: output,
                    },
                ],
            },
        ];

        beforeEach(() => {
            mockReadRecipeFile.mockResolvedValue(recipes);
            mockReadBehaviourFile.mockResolvedValue([]);
        });

        test("defaults to default toolset in converted output", async () => {
            const expected: UntranslatedItem = {
                id: output,
                createTime: 20,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.steel,
                },
                creatorID: creator,
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("logs message indicating default has taken place", async () => {
            await convertRecipes(input);

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                `Defaulting to default toolset for recipe: ${output} from creator: ${creator}`,
            );
        });
    });

    test.each([["beekeeper"], ["berryfarmer"], ["chickenfarmer"]])(
        "defaults to no toolset if no toolset specified and creator is: %s",
        async (creator: string) => {
            const output = "poisondart";
            const recipes: Recipes = [
                {
                    cooldown: 20,
                    name: `pipliz.${creator}.${output}`,
                    requires: [],
                    results: [
                        {
                            type: output,
                        },
                    ],
                },
            ];
            mockReadRecipeFile.mockResolvedValue(recipes);
            mockReadBehaviourFile.mockResolvedValue([]);
            const expected: UntranslatedItem = {
                id: output,
                createTime: 20,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creatorID: creator,
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        },
    );

    test.each([
        ["no outputs", []],
        ["missing primary output", [{ type: "another item" }]],
    ])(
        "throws an error if recipe has no outputs",
        async (_: string, results: Recipes[number]["results"]) => {
            const creator = "alchemist";
            const output = "poisondart";
            const recipes: Recipes = [
                {
                    cooldown: 20,
                    name: `pipliz.${creator}.${output}`,
                    requires: [],
                    results,
                },
            ];
            mockReadRecipeFile.mockResolvedValue(recipes);
            const behaviours: BlockBehaviours = [
                {
                    baseType: {
                        attachBehaviour: [
                            {
                                npcType: `pipliz.${creator}`,
                                toolset: noToolset.key,
                            },
                        ],
                    },
                },
            ];
            mockReadBehaviourFile.mockResolvedValue(behaviours);

            expect.assertions(1);
            await expect(convertRecipes(input)).rejects.toThrowError(
                `Unable to find primary output for recipe: ${output} from creator: ${creator}`,
            );
        },
    );

    test.each([
        ["default", undefined, 1],
        ["specified", 2, 2],
    ])(
        "returns converted recipe given a single recipe with no toolset and no requirements and %s optional output amount",
        async (
            _: string,
            specifiedOutput: number | undefined,
            expectedOutput: number,
        ) => {
            const creator = "alchemist";
            const primaryOutput = "poisondart";
            const optionalOutput = "gunpowder";
            const recipes: Recipes = [
                {
                    cooldown: 20,
                    name: `pipliz.${creator}.${primaryOutput}`,
                    requires: [],
                    results: [
                        {
                            type: primaryOutput,
                        },
                        {
                            type: optionalOutput,
                            isOptional: true,
                            chance: 0.5,
                            ...(specifiedOutput
                                ? { amount: specifiedOutput }
                                : {}),
                        },
                    ],
                },
            ];
            mockReadRecipeFile.mockResolvedValue(recipes);
            const behaviours: BlockBehaviours = [
                {
                    baseType: {
                        attachBehaviour: [
                            {
                                npcType: `pipliz.${creator}`,
                                toolset: noToolset.key,
                            },
                        ],
                    },
                },
            ];
            mockReadBehaviourFile.mockResolvedValue(behaviours);
            const expected: UntranslatedItem = {
                id: primaryOutput,
                createTime: 20,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creatorID: creator,
                optionalOutputs: [
                    {
                        id: optionalOutput,
                        amount: expectedOutput,
                        likelihood: 0.5,
                    },
                ],
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        },
    );

    test.each([
        ["default", undefined, 1],
        ["specified", 0.5, 0.5],
    ])(
        "returns converted recipe given a single recipe with no toolset and no requirements and %s optional output likelihood",
        async (
            _: string,
            specifiedLikelihood: number | undefined,
            expectedLikelihood: number,
        ) => {
            const creator = "alchemist";
            const primaryOutput = "poisondart";
            const optionalOutput = "gunpowder";
            const recipes: Recipes = [
                {
                    cooldown: 20,
                    name: `pipliz.${creator}.${primaryOutput}`,
                    requires: [],
                    results: [
                        {
                            type: primaryOutput,
                        },
                        {
                            type: optionalOutput,
                            isOptional: true,
                            ...(specifiedLikelihood
                                ? { chance: specifiedLikelihood }
                                : {}),
                        },
                    ],
                },
            ];
            mockReadRecipeFile.mockResolvedValue(recipes);
            const behaviours: BlockBehaviours = [
                {
                    baseType: {
                        attachBehaviour: [
                            {
                                npcType: `pipliz.${creator}`,
                                toolset: noToolset.key,
                            },
                        ],
                    },
                },
            ];
            mockReadBehaviourFile.mockResolvedValue(behaviours);
            const expected: UntranslatedItem = {
                id: primaryOutput,
                createTime: 20,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creatorID: creator,
                optionalOutputs: [
                    {
                        id: optionalOutput,
                        amount: 1,
                        likelihood: expectedLikelihood,
                    },
                ],
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        },
    );

    describe("handles eyeglasses toolset", () => {
        const tools = PiplizTools.eyeglasses;
        const toolset: PiplizToolsets[number] = {
            key: tools,
            usable: [tools],
        };
        const creator = "alchemist";
        const output = "poisondart";
        const recipes: Recipes = [
            {
                cooldown: 20,
                name: `pipliz.${creator}.${output}`,
                requires: [],
                results: [
                    {
                        type: output,
                    },
                ],
            },
        ];
        const behaviours: BlockBehaviours = [
            {
                baseType: {
                    attachBehaviour: [
                        {
                            npcType: `pipliz.${creator}`,
                            toolset: tools,
                        },
                    ],
                },
            },
        ];

        beforeEach(() => {
            mockReadToolFile.mockResolvedValue([toolset]);
            mockReadRecipeFile.mockResolvedValue(recipes);
            mockReadBehaviourFile.mockResolvedValue(behaviours);
        });

        test("does not convert any item that has unknown toolset", async () => {
            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(0);
        });

        test("logs skipped item to console", async () => {
            await convertRecipes(input);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                `Skipping recipe: ${output} from creator: ${creator} as requires unsupported toolset`,
            );
        });
    });

    describe("handles machine tools", () => {
        const creator = "metallathe";
        const output = "brassparts";

        beforeEach(() => {
            const recipes: Recipes = [
                {
                    cooldown: 20,
                    name: `pipliz.${creator}.${output}`,
                    requires: [],
                    results: [
                        {
                            type: output,
                        },
                    ],
                },
            ];
            const behaviours: BlockBehaviours = [
                {
                    baseType: {
                        attachBehaviour: [
                            {
                                npcType: `pipliz.${creator}`,
                                toolset: PiplizTools.machinetools,
                            },
                        ],
                    },
                },
            ];
            mockReadRecipeFile.mockResolvedValue(recipes);
            mockReadBehaviourFile.mockResolvedValue(behaviours);
        });

        test("returns converted recipe for recipe that requires machine tools", async () => {
            const expected: UntranslatedItem = {
                id: output,
                createTime: 20,
                output: 1,
                requires: [],
                toolset: {
                    type: "machine",
                    minimumTool: MachineToolset.machine,
                    maximumTool: MachineToolset.machine,
                },
                creatorID: creator,
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });
    });

    test.each([
        [
            "min",
            PiplizTools.stonetools,
            PiplizTools.steeltools,
            DefaultToolset.stone,
            DefaultToolset.steel,
        ],
        [
            "max",
            PiplizTools.notools,
            PiplizTools.coppertools,
            DefaultToolset.none,
            DefaultToolset.copper,
        ],
    ])(
        "handles default toolset with non-default %s",
        async (
            _: string,
            min: PiplizTools,
            max: PiplizTools,
            expectedMin: DefaultToolset,
            expectedMax: DefaultToolset,
        ) => {
            const toolsKey = "test tools";
            const toolset: PiplizToolsets[number] = {
                key: toolsKey,
                usable: [max, min],
            };
            const creator = "alchemist";
            const output = "poisondart";
            const recipes: Recipes = [
                {
                    cooldown: 20,
                    name: `pipliz.${creator}.${output}`,
                    requires: [],
                    results: [
                        {
                            type: output,
                        },
                    ],
                },
            ];
            const behaviours: BlockBehaviours = [
                {
                    baseType: {
                        attachBehaviour: [
                            {
                                npcType: `pipliz.${creator}`,
                                toolset: toolsKey,
                            },
                        ],
                    },
                },
            ];
            const expected: UntranslatedItem = {
                id: output,
                createTime: 20,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: expectedMin,
                    maximumTool: expectedMax,
                },
                creatorID: creator,
            };
            mockReadToolFile.mockResolvedValue([toolset]);
            mockReadRecipeFile.mockResolvedValue(recipes);
            mockReadBehaviourFile.mockResolvedValue(behaviours);

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        },
    );

    test("returns converted recipes given multiple valid recipes", async () => {
        const firstRecipeOutput = "poisondart";
        const secondRecipeOutput = "gunpowder";
        const creator = "alchemist";
        const recipes: Recipes = [
            {
                cooldown: 15,
                name: `pipliz.${creator}.${firstRecipeOutput}`,
                requires: [],
                results: [
                    {
                        type: firstRecipeOutput,
                    },
                ],
            },
            {
                cooldown: 25,
                name: `pipliz.${creator}.${secondRecipeOutput}`,
                requires: [],
                results: [
                    {
                        type: secondRecipeOutput,
                    },
                ],
            },
        ];
        mockReadRecipeFile.mockResolvedValue(recipes);
        const behaviours: BlockBehaviours = [
            {
                baseType: {
                    attachBehaviour: [
                        {
                            npcType: `pipliz.${creator}`,
                            toolset: noToolset.key,
                        },
                    ],
                },
            },
        ];
        mockReadBehaviourFile.mockResolvedValue(behaviours);
        const expected: UntranslatedItem[] = [
            {
                id: firstRecipeOutput,
                createTime: 15,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creatorID: creator,
            },
            {
                id: secondRecipeOutput,
                createTime: 25,
                output: 1,
                requires: [],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creatorID: creator,
            },
        ];

        const actual = await convertRecipes(input);

        expect(actual).toHaveLength(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    });

    test.each([
        ["default", undefined, 1],
        ["specified", 0.5, 0.5],
    ])(
        "returns converted recipe given a single recipe with requirement that has %s required amount",
        async (
            _: string,
            specifiedAmount: number | undefined,
            expectedAmount: number,
        ) => {
            const creator = "alchemist";
            const output = "poisondart";
            const requirement = "gunpowder";
            const recipes: Recipes = [
                {
                    cooldown: 20,
                    name: `pipliz.${creator}.${output}`,
                    requires: [
                        {
                            type: requirement,
                            ...(specifiedAmount
                                ? { amount: specifiedAmount }
                                : {}),
                        },
                    ],
                    results: [
                        {
                            type: output,
                        },
                    ],
                },
            ];
            mockReadRecipeFile.mockResolvedValue(recipes);
            const behaviours: BlockBehaviours = [
                {
                    baseType: {
                        attachBehaviour: [
                            {
                                npcType: `pipliz.${creator}`,
                                toolset: noToolset.key,
                            },
                        ],
                    },
                },
            ];
            mockReadBehaviourFile.mockResolvedValue(behaviours);
            const expected: UntranslatedItem = {
                id: output,
                createTime: 20,
                output: 1,
                requires: [{ id: requirement, amount: expectedAmount }],
                toolset: {
                    type: "default",
                    minimumTool: DefaultToolset.none,
                    maximumTool: DefaultToolset.none,
                },
                creatorID: creator,
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        },
    );

    test("throws an error if more than one recipe for same item and creator", async () => {
        const sameItemName = "stonerubble";
        const sameItemCreator = "alchemist";
        const expectedError = `Multiple recipes for item: ${sameItemName} from creator: ${sameItemCreator}, please remove one`;
        const recipes: Recipes = [
            {
                cooldown: 20,
                name: `pipliz.${sameItemCreator}.${sameItemName}`,
                requires: [],
                results: [
                    {
                        type: sameItemName,
                    },
                ],
            },
            {
                cooldown: 15,
                name: `pipliz.${sameItemCreator}.${sameItemName}`,
                requires: [],
                results: [
                    {
                        type: sameItemName,
                    },
                ],
            },
        ];
        mockReadRecipeFile.mockResolvedValue(recipes);
        const behaviours: BlockBehaviours = [
            {
                baseType: {
                    attachBehaviour: [
                        {
                            npcType: `pipliz.${sameItemCreator}`,
                            toolset: noToolset.key,
                        },
                    ],
                },
            },
        ];
        mockReadBehaviourFile.mockResolvedValue(behaviours);

        expect.assertions(1);
        await expect(convertRecipes(input)).rejects.toThrowError(expectedError);
    });
});
