import path from "path";
import { when } from "jest-when";

import { CraftableRecipeConverterInputs } from "../../interfaces/craftable-recipe-converter";
import { convertRecipes as baseConvertRecipes } from "../craftable-recipe-converter";
import {
    BlockBehaviours,
    Recipes,
    PiplizTools,
    PiplizToolsets,
    Item,
    APITools,
    Items,
} from "../../types";

const mockFindFiles = jest.fn();
const mockReadToolFile = jest.fn();
const mockReadBehaviourFile = jest.fn();
const mockReadRecipeFile = jest.fn();

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

const consoleLogSpy = jest
    .spyOn(console, "log")
    .mockImplementation(() => undefined);

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

describe("recipe to item mapping", () => {
    beforeEach(() => {
        when(mockFindFiles)
            .calledWith(expectedRecipesFileFindInput)
            .mockResolvedValue([recipeFiles[0]]);
    });

    test.each([
        ["default", undefined, 1],
        ["specified", 2, 2],
    ])(
        "returns converted recipe given a single recipe with no toolset and no requirements and %s output",
        async (
            _: string,
            specifiedOutput: number | undefined,
            expectedOutput: number
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
            const expected: Item = {
                name: "Poison dart",
                createTime: 20,
                output: expectedOutput,
                requires: [],
                minimumTool: APITools.none,
                maximumTool: APITools.none,
                creator: "Alchemist",
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        }
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
            `Unknown toolset: ${invalidToolset} required by ${creator}`
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
            const expected: Item = {
                name: "Poison dart",
                createTime: 20,
                output: 1,
                requires: [],
                minimumTool: APITools.none,
                maximumTool: APITools.steel,
                creator: "Alchemist",
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        });

        test("logs message indicating default has taken place", async () => {
            await convertRecipes(input);

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                `Defaulting to default toolset for recipe: ${output} from creator: ${creator}`
            );
        });
    });

    test.each([
        ["beekeeper", "Beekeeper"],
        ["berryfarmer", "Berry farmer"],
        ["chickenfarmer", "Chicken farmer"],
    ])(
        "defaults to no toolset if no toolset specified and creator is: %s",
        async (creator: string, userFriendlyCreator: string) => {
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
            const expected: Item = {
                name: "Poison dart",
                createTime: 20,
                output: 1,
                requires: [],
                minimumTool: APITools.none,
                maximumTool: APITools.none,
                creator: userFriendlyCreator,
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        }
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
                `Unable to find primary output for recipe: ${output} from creator: ${creator}`
            );
        }
    );

    test("throws an error if provided an item with an unknown name", async () => {
        const creator = "alchemist";
        const output = "unknown item";
        const recipes: Recipes = [
            {
                cooldown: 20,
                name: `pipliz.${creator}.${output}`,
                requires: [],
                results: [{ type: output }],
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
            `User friendly name unavailable for item: ${output}`
        );
    });

    test("throws an error if provided an item with an unknown creator", async () => {
        const creator = "unknown creator";
        const output = "poisondart";
        const recipes: Recipes = [
            {
                cooldown: 20,
                name: `pipliz.${creator}.${output}`,
                requires: [],
                results: [{ type: output }],
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
            `User friendly name unavailable for creator: ${creator}`
        );
    });

    test.each([
        ["default", undefined, 1],
        ["specified", 2, 2],
    ])(
        "returns converted recipe given a single recipe with no toolset and no requirements and %s optional output amount",
        async (
            _: string,
            specifiedOutput: number | undefined,
            expectedOutput: number
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
            const expected: Item = {
                name: "Poison dart",
                createTime: 20,
                output: 1,
                requires: [],
                minimumTool: APITools.none,
                maximumTool: APITools.none,
                creator: "Alchemist",
                optionalOutputs: [
                    {
                        name: "Gunpowder",
                        amount: expectedOutput,
                        likelihood: 0.5,
                    },
                ],
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        }
    );

    test.each([
        ["default", undefined, 1],
        ["specified", 0.5, 0.5],
    ])(
        "returns converted recipe given a single recipe with no toolset and no requirements and %s optional output likelihood",
        async (
            _: string,
            specifiedLikelihood: number | undefined,
            expectedLikelihood: number
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
            const expected: Item = {
                name: "Poison dart",
                createTime: 20,
                output: 1,
                requires: [],
                minimumTool: APITools.none,
                maximumTool: APITools.none,
                creator: "Alchemist",
                optionalOutputs: [
                    {
                        name: "Gunpowder",
                        amount: 1,
                        likelihood: expectedLikelihood,
                    },
                ],
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        }
    );

    test("throws an error if provided an optional output with an unknown name", async () => {
        const creator = "alchemist";
        const output = "poisondart";
        const optionalOutput = "unknown optional output";
        const recipes: Recipes = [
            {
                cooldown: 20,
                name: `pipliz.${creator}.${output}`,
                requires: [],
                results: [
                    { type: output },
                    { type: optionalOutput, amount: 1 },
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

        expect.assertions(1);
        await expect(convertRecipes(input)).rejects.toThrowError(
            `User friendly name unavailable for item: ${optionalOutput}`
        );
    });

    describe.each([PiplizTools.machinetools, PiplizTools.eyeglasses])(
        "handles unknown toolset: %s",
        (tools: PiplizTools) => {
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
                    `Skipping recipe: ${output} from creator: ${creator} as requires unsupported toolset`
                );
            });
        }
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
        const expected: Items = [
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
            expectedAmount: number
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
            const expected: Item = {
                name: "Poison dart",
                createTime: 20,
                output: 1,
                requires: [{ name: "Gunpowder", amount: expectedAmount }],
                minimumTool: APITools.none,
                maximumTool: APITools.none,
                creator: "Alchemist",
            };

            const actual = await convertRecipes(input);

            expect(actual).toHaveLength(1);
            expect(actual[0]).toEqual(expected);
        }
    );

    test("throws an error if provided an requirement with an unknown name", async () => {
        const creator = "alchemist";
        const output = "poisondart";
        const requirement = "unknown requirement";
        const recipes: Recipes = [
            {
                cooldown: 20,
                name: `pipliz.${creator}.${output}`,
                requires: [
                    {
                        type: requirement,
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

        expect.assertions(1);
        await expect(convertRecipes(input)).rejects.toThrowError(
            `User friendly name unavailable for item: ${requirement}`
        );
    });

    describe("handles known items and known creators", () => {
        test.each([
            ["poisondart", "Poison dart"],
            ["gunpowder", "Gunpowder"],
            ["hempfibre", "Hemp fibre"],
            ["wisteriaflower", "Wisteria flower"],
            ["saltpeter", "Salt peter"],
            ["charcoal", "Charcoal"],
            ["sulfur", "Sulfur"],
            ["vialmineraloil", "Vial of mineral oil"],
            ["coalore", "Coal ore"],
            ["potwater", "Pot of water"],
            ["vialempty", "Empty Vial"],
            ["potempty", "Empty pot"],
            ["vialsulphuricacid", "Vial of sulphuric acid"],
            ["firewood", "Firewood"],
            ["vialnitricacid", "Vial of nitric acid"],
            ["nitro", "Nitro"],
            ["cottonfibre", "Cotton fibre"],
            ["candle", "Candle"],
            ["berry", "Berry"],
            ["berrymeal", "Berry meal"],
            ["ironbloom", "Iron bloom"],
            ["ironore", "Iron ore"],
            ["steelingot", "Steel ingot"],
            ["ironwrought", "Iron wrought"],
            ["silicasand", "Silica sand"],
            ["glasspiece", "Piece of glass"],
            ["cokes", "Cokes"],
            ["chest", "Chest"],
            ["chestresource", "Science chest"],
            ["copperingot", "Copper ingot"],
            ["goldingot", "Gold ingot"],
            ["bronzeingot", "Bronze ingot"],
            ["chestluxury", "Luxury chest"],
            ["luxurygarments", "Luxury garments"],
            ["goldenshield", "Golden shield"],
            ["monocular", "Monocular"],
            ["earthenware", "Earthenware"],
            ["chestprestige", "Prestige chest"],
            ["tabulator", "Tabulator"],
            ["guntrap", "Gun trap"],
            ["steeltools", "Steel tools"],
            ["chickenraw", "Raw chicken"],
            ["barley", "Barley"],
            ["chickenpoop", "Chicken poop"],
            ["potash", "Pot ash"],
            ["leavestemperate", "Leaves"],
            ["dirt", "Dirt"],
            ["straw", "Straw"],
            ["grassdry", "Dry grass"],
            ["grassmid", "Medium Grass"],
            ["grasswet", "Wet grass"],
            ["grassmax", "Max grass"],
            ["cookedmeat", "Cooked meat"],
            ["rawmeat", "Raw meat"],
            ["chickenmeal", "Chicken meal"],
            ["cabbage", "Cabbage"],
            ["cookedfish", "Cooked fish"],
            ["rawfish", "Raw fish"],
            ["bread", "Bread"],
            ["potflour", "Pot of flour"],
            ["breadmeal", "Bread meal"],
            ["coppertools", "Copper tools"],
            ["planks", "Planks"],
            ["goldjewellery", "Gold jewellery"],
            ["copperlockbox", "Copper lockbox"],
            ["steelparts", "Steel parts"],
            ["brassparts", "Brass parts"],
            ["brassingot", "Brass ingot"],
            ["failsafe", "Failsafe"],
            ["bronzetools", "Bronze tools"],
            ["irontools", "Iron tools"],
            ["leather", "Leather"],
            ["machinetools", "Machine tools"],
            ["linen", "Linen"],
            ["alkanet", "Alkanet"],
            ["hollyhock", "Hollyhock"],
            ["wolfsbane", "Wolfsbane"],
            ["lanternred", "Red lantern"],
            ["lanternyellow", "Yellow lantern"],
            ["lanterngreen", "Green lantern"],
            ["lanternblue", "Blue lantern"],
            ["lanterncyan", "Cyan lantern"],
            ["lanternpink", "Pink lantern"],
            ["planksred", "Red planks"],
            ["planksgreen", "Green planks"],
            ["planksblue", "Blue planks"],
            ["droppertrap", "Dropper trap"],
            ["projectiletrap", "Projectile trap"],
            ["projectiletrapammo", "Projectile trap ammo"],
            ["droppertrapammo", "Dropper trap ammo"],
            ["alarmbell", "Alarm bell"],
            ["scrollofknowledge", "Scroll of knowledge"],
            ["astrolabe", "Astrolabe"],
            ["compass", "Compass"],
            ["tabletwisdom", "Tablet of wisdom"],
            ["eyeglasses", "Eye glasses"],
            ["bronzelockbox", "Bronze lockbox"],
            ["steellockbox", "Steel lockbox"],
            ["ropetrap", "Rope trap"],
            ["ropetrapammo", "Rope trap ammo"],
            ["rope", "Rope"],
            ["caltroptrap", "Caltrop trap"],
            ["caltrops", "Caltrops"],
            ["metalgear", "Metal gear"],
            ["glider", "Glider"],
            ["glidersteel", "Steel glider"],
            ["bookofknowledge", "Book of knowledge"],
            ["elevatorshaft", "Elevator shaft"],
            ["elevator", "Elevator"],
            ["elevatorhorizontal", "Horizontal elevator"],
            ["elevatorshafthorizontal", "Horizontal elevator shaft"],
            ["wheatporridge", "Wheat porridge"],
            ["wheat", "Wheat"],
            ["bow", "Bow"],
            ["flax", "Flax"],
            ["copperarrow", "Copper arrow"],
            ["guardbowdayjob", "Bow guard day job"],
            ["guardbownightjob", "Bow guard night job"],
            ["crossbow", "Crossbow"],
            ["crossbowbolt", "Crossbow bolt"],
            ["guardcrossbowdayjob", "Crossbow guard day job"],
            ["guardcrossbownightjob", "Crossbow guard night job"],
            ["gunpowdertrap", "Gunpowder trap"],
            ["gunpowdertrapammo", "Gunpowder trap ammo"],
            ["guntrapammo", "Gun trap ammo"],
            ["leadingot", "Lead ingot"],
            ["musket", "Musket"],
            ["musketammo", "Musket ammo"],
            ["grenadelauncher", "Grenade launcher"],
            ["grenadelauncherammo", "Grenade launcher ammo"],
            ["handcannon", "Hand cannon"],
            ["handcannonammo", "Hand cannon ammo"],
            ["guardhandcannondayjob", "Hand cannon guard day job"],
            ["guardhandcannonnightjob", "Hand cannon guard night job"],
            ["guardgrenadedayjob", "Grenade guard day job"],
            ["guardgrenadenightjob", "Grenade guard night job"],
            ["lanternwhite", "White lantern"],
            ["lanternorange", "Orange lantern"],
            ["goldenstatue", "Golden statue"],
            ["jobblockcrafter", "Job block crafter"],
            ["firepit", "Firepit"],
            ["stonerubble", "Stone rubble"],
            ["merchanthub", "Merchant hub"],
            ["waterpump", "Water pump"],
            ["fisherman", "Fisherman"],
            ["tailorshop", "Tailor shop"],
            ["statisticsboard", "Statistics board"],
            ["parchment", "Parchment"],
            ["toolshop", "Toolshop"],
            ["sanctifiertable", "Sanctifier table"],
            ["fletcherbench", "Fletcher bench"],
            ["npcshop", "Grocery store"],
            ["copperanvil", "Copper anvil"],
            ["tannertable", "Tanner table"],
            ["scribedesk", "Scribe desk"],
            ["writerdesk", "Writer desk"],
            ["stove", "Stove"],
            ["grindstone", "Grindstone"],
            ["dyertable", "Dyer table"],
            ["ropebench", "Rope bench"],
            ["stonemasonworkbench", "Stonemason workbench"],
            ["jewellerbench", "Jeweller bench"],
            ["papermakersmould", "Paper makers mould"],
            ["wisteriajob", "Wisteria job"],
            ["wisteriaplantempty", "Wisteria plant"],
            ["alchemisttable", "Alchemist table"],
            ["guardpoison", "Poison guard"],
            ["engineerbench", "Engineer bench"],
            ["trapfixer", "Trap fixer"],
            ["jobblockcrafteradvanced", "Advanced job block crafter"],
            ["bloomery", "Bloomery"],
            ["bricks", "Bricks"],
            ["kiln", "Kiln"],
            ["printingpress", "Printing press"],
            ["chestmaker", "Chest maker"],
            ["gunsmith", "Gunsmith"],
            ["compostingbin", "Composting bin"],
            ["logwall", "Log wall"],
            ["glassblower", "Glassblower"],
            ["guardmusketdayjob", "Musket guard day job"],
            ["guardmusketnightjob", "Musket guard night job"],
            ["cottonengine", "Cotten engine"],
            ["metallathe", "Metal lathe"],
            ["blastfurnace", "Blast furnace"],
            ["researcherdesk", "Researcher desk"],
            ["paper", "Paper"],
            ["bookcase", "Bookcase"],
            ["colonykit", "Colony kit"],
            ["outpostbanner", "Outpost banner"],
            ["carddata", "Punched card"],
            ["clay", "Clay"],
            ["tabletclay", "Clay tablet"],
            ["sanctifiedporridge", "Sanctified porridge"],
            ["sanctifiedbreadmeal", "Sanctified bread meal"],
            ["sanctifiedchickenmeal", "Sanctified chicken meal"],
            ["sanctifiedhouse", "Sacred storage"],
            ["copper", "Copper"],
            ["goldore", "Gold ore"],
            ["tin", "Tin"],
            ["zinc", "Zinc"],
            ["leadore", "Lead ore"],
            ["brickslight", "Light bricks"],
            ["mudbricks", "Mud bricks"],
            ["quarterblockgrey", "Grey quarter block"],
            ["stoneblock", "Stone block"],
            ["darkstone", "Dark stone"],
            ["stonebricks", "Stone bricks"],
            ["stonebricksblack", "Black stone bricks"],
            ["stonebricksbrown", "Brown stone bricks"],
            ["stonebrickswhite", "White stone bricks"],
            ["bricksblack", "Black bricks"],
            ["bricksdarkred", "Dark red bricks"],
            ["bricksdarkyellow", "Dark yellow bricks"],
            ["bricksred", "Red bricks"],
            ["hemp", "Hemp"],
            ["skin", "Skin"],
            ["animalcarcass", "Animal carcass"],
            ["stonetools", "Stone tools"],
            ["logtemperate", "Log"],
            ["bed", "Bed"],
            ["wheatmeal", "Wheat meal"],
            ["minerjob", "Miner"],
            ["tinkerertable", "Tinkerer table"],
            ["sling", "Sling"],
            ["guardslingerdayjob", "Slinger guard day job"],
            ["guardslingernightjob", "Slinger guard night job"],
            ["furnace", "Furnace"],
            ["splittingstump", "Splitting stump"],
            ["potterystation", "Pottery station"],
            ["watergatherer", "Water gatherer"],
            ["slingbullet", "Sling bullet"],
            ["crate", "Crate"],
            ["torch", "Torch"],
            ["woodfloor", "Wood floor"],
            ["quarterblockbrowndark", "Dark brown quarter block"],
            ["quarterblockbrownlight", "Light brown quarter block"],
        ])(
            "can handle recipes for item: %s",
            async (itemName: string, expectedConvertedItemName: string) => {
                const creator = "alchemist";
                const recipes: Recipes = [
                    {
                        cooldown: 20,
                        name: `pipliz.${creator}.${itemName}`,
                        requires: [],
                        results: [
                            {
                                type: itemName,
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
                const expected: Item = {
                    name: expectedConvertedItemName,
                    createTime: 20,
                    output: 1,
                    requires: [],
                    minimumTool: APITools.none,
                    maximumTool: APITools.none,
                    creator: "Alchemist",
                };

                const actual = await convertRecipes(input);

                expect(actual).toHaveLength(1);
                expect(actual[0]).toEqual(expected);
            }
        );

        test.each([
            ["alchemist", "Alchemist"],
            ["beekeeper", "Beekeeper"],
            ["berryfarmer", "Berry farmer"],
            ["bloomeryjob", "Bloomery worker"],
            ["chestmaker", "Chest maker"],
            ["chickenfarmer", "Chicken farmer"],
            ["composter", "Composter"],
            ["cook", "Cook"],
            ["coppersmith", "Copper smith"],
            ["dyer", "Dyer"],
            ["engineer", "Engineer"],
            ["firepit", "Fire pit cook"],
            ["fisherman", "Fisherman"],
            ["fletcher", "Fletcher"],
            ["glassblower", "Glassblower"],
            ["grinder", "Grinder"],
            ["gunsmith", "Gunsmith"],
            ["jeweller", "Jeweller"],
            ["jobblockcrafter", "Job block crafter"],
            ["jobblockcrafteradvanced", "Advanced job block crafter"],
            ["kilnjob", "Kiln worker"],
            ["papermaker", "Paper maker"],
            ["potter", "Potter"],
            ["roper", "Roper"],
            ["sanctifier", "Sanctifier"],
            ["smelter", "Smelter"],
            ["stonemason", "Stone mason"],
            ["tailorshop", "Tailor"],
            ["tanner", "Tanner"],
            ["tinkerer", "Tinkerer"],
            ["watergatherer", "Water gatherer"],
            ["waterpump", "Water pump worker"],
            ["woodcutter", "Woodcutter"],
        ])(
            "can handle recipes from creator: %s",
            async (creator: string, expectedConvertedCreator: string) => {
                const itemName = "poisondart";
                const recipes: Recipes = [
                    {
                        cooldown: 20,
                        name: `pipliz.${creator}.${itemName}`,
                        requires: [],
                        results: [
                            {
                                type: itemName,
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
                const expected: Item = {
                    name: "Poison dart",
                    createTime: 20,
                    output: 1,
                    requires: [],
                    minimumTool: APITools.none,
                    maximumTool: APITools.none,
                    creator: expectedConvertedCreator,
                };

                const actual = await convertRecipes(input);

                expect(actual).toHaveLength(1);
                expect(actual[0]).toEqual(expected);
            }
        );
    });

    test("throws an error if more than one recipe for same item and creator", async () => {
        const sameItemName = "stonerubble";
        const sameItemCreator = "alchemist";
        const expectedError = `Multiple recipes for item: Stone rubble from creator: Alchemist, please remove one`;
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
