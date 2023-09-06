import path from "path";
import { when } from "jest-when";

import { RecipeConverterInputs } from "../../interfaces/recipe-converter";
import { convertRecipes as baseConvertRecipes } from "../recipe-converter";
import {
    BlockBehaviours,
    Recipes,
    PiplizTools,
    PiplizToolsets,
    Item,
    APITools,
} from "../../types";
import { Items } from "../../types/generated/items";

const mockFindFiles = jest.fn();
const mockReadToolFile = jest.fn();
const mockReadBehaviourFile = jest.fn();
const mockReadRecipeFile = jest.fn();
const mockWriteJSON = jest.fn();

const convertRecipes = (input: RecipeConverterInputs) =>
    baseConvertRecipes({
        ...input,
        findFiles: mockFindFiles,
        readToolsFile: mockReadToolFile,
        readBehavioursFile: mockReadBehaviourFile,
        readRecipeFile: mockReadRecipeFile,
        writeJSON: mockWriteJSON,
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

        test("does not write any json", async () => {
            try {
                await convertRecipes(input);
            } catch {
                // Expected
            }

            expect(mockWriteJSON).not.toHaveBeenCalled();
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

        test("does not write any json", async () => {
            try {
                await convertRecipes(input);
            } catch {
                // Expected
            }

            expect(mockWriteJSON).not.toHaveBeenCalled();
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
        "writes converted recipe to file given a single recipe with no toolset and no requirements and %s output",
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

            await convertRecipes(input);

            expect(mockWriteJSON).toHaveBeenCalledTimes(1);
            expect(mockWriteJSON).toHaveBeenCalledWith(input.outputFilePath, [
                expected,
            ]);
        }
    );

    test("throws an error if cannot find a toolset for provided creator", async () => {
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
        "writes converted recipe to file given a single recipe with no toolset and no requirements and %s optional output amount",
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

            await convertRecipes(input);

            expect(mockWriteJSON).toHaveBeenCalledTimes(1);
            expect(mockWriteJSON).toHaveBeenCalledWith(input.outputFilePath, [
                expected,
            ]);
        }
    );

    test.each([
        ["default", undefined, 1],
        ["specified", 0.5, 0.5],
    ])(
        "writes converted recipe to file given a single recipe with no toolset and no requirements and %s optional output likelihood",
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

            await convertRecipes(input);

            expect(mockWriteJSON).toHaveBeenCalledTimes(1);
            expect(mockWriteJSON).toHaveBeenCalledWith(input.outputFilePath, [
                expected,
            ]);
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
                await convertRecipes(input);

                expect(mockWriteJSON).toHaveBeenCalledTimes(1);
                expect(mockWriteJSON).toHaveBeenCalledWith(
                    input.outputFilePath,
                    []
                );
            });

            test("logs skipped item to console", async () => {
                await convertRecipes(input);

                expect(consoleLogSpy).toHaveBeenCalledWith(
                    `Skipping recipe: ${output} from creator: ${creator} as requires unsupported toolset`
                );
            });
        }
    );

    test("writes converted recipe to file given multiple valid recipes", async () => {
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

        await convertRecipes(input);

        expect(mockWriteJSON).toHaveBeenCalledTimes(1);
        expect(mockWriteJSON).toHaveBeenCalledWith(
            input.outputFilePath,
            expected
        );
    });

    test.each([
        ["default", undefined, 1],
        ["specified", 0.5, 0.5],
    ])(
        "writes converted recipe to file given a single recipe with requirement that has %s required amount",
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

            await convertRecipes(input);

            expect(mockWriteJSON).toHaveBeenCalledTimes(1);
            expect(mockWriteJSON).toHaveBeenCalledWith(input.outputFilePath, [
                expected,
            ]);
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
});
