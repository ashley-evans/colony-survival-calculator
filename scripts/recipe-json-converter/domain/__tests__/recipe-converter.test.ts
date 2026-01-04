import path from "path";
import { vi } from "vitest";

import { RecipeConverterInputs } from "../../interfaces/recipe-converter";
import { convertRecipes as baseConvertRecipes } from "../recipe-converter";
import {
    DefaultToolset,
    Items,
    MachineToolset,
    UntranslatedItem,
} from "../../types";
import {
    FlattenedLocalisation,
    LocalisationConverterOutput,
} from "../../interfaces/localisation-converter";

const mockConvertCrafteableRecipes = vi.fn();
const mockConvertMineableItems = vi.fn();
const mockConvertGrowables = vi.fn();
const mockConvertLocalisation = vi.fn();
const mockWriteJSON = vi.fn();

const convertRecipes = (input: RecipeConverterInputs) =>
    baseConvertRecipes({
        ...input,
        convertCraftableRecipes: mockConvertCrafteableRecipes,
        convertMineableItems: mockConvertMineableItems,
        convertGrowables: mockConvertGrowables,
        convertLocalisation: mockConvertLocalisation,
        writeJSON: mockWriteJSON,
    });

const input: RecipeConverterInputs = {
    inputDirectoryPath: path.join(__dirname, "/test"),
    outputFilePath: path.join(__dirname, "/test.json"),
};

const localisationData: FlattenedLocalisation = {
    creators: {
        alchemist: {
            "en-US": "Alchemist",
            "de-DE": "Alchemist",
        },
        metallathe: {
            "en-US": "Metal Lathe Operator",
            "de-DE": "Metall-Drehmaschinenbediener",
        },
        minerjob: {
            "en-US": "Miner",
            "de-DE": "Bergarbeiter",
        },
        wheatfarmer: {
            "en-US": "Wheat Farmer",
            "de-DE": "Weizenbauer",
        },
        forester: {
            "en-US": "Forester",
            "de-DE": "Forstwirt",
        },
    },
    items: {
        poisondart: {
            "en-US": "Poison Dart",
            "de-DE": "Giftpfeil",
        },
        gunpowder: {
            "en-US": "Gunpowder",
            "de-DE": "Schwarzpulver",
        },
        brassparts: {
            "en-US": "Brass Parts",
            "de-DE": "Messingteile",
        },
        goldore: {
            "en-US": "Gold Ore",
            "de-DE": "Golderz",
        },
        wheat: {
            "en-US": "Wheat",
            "de-DE": "Weizen",
        },
    },
};

const localisationOutput: LocalisationConverterOutput = {
    locales: new Set(["en-US", "de-DE"]),
    data: localisationData,
};

const expectedCraftableRecipes: Items = [
    {
        id: "poisondart",
        createTime: 15,
        output: 1,
        requires: [],
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.none,
        },
        creatorID: "alchemist",
        i18n: {
            creator: {
                "en-US": "Alchemist",
                "de-DE": "Alchemist",
            },
            name: {
                "en-US": "Poison Dart",
                "de-DE": "Giftpfeil",
            },
        },
    },
    {
        id: "gunpowder",
        createTime: 25,
        output: 1,
        requires: [],
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.none,
        },
        creatorID: "alchemist",
        i18n: {
            creator: {
                "en-US": "Alchemist",
                "de-DE": "Alchemist",
            },
            name: {
                "en-US": "Gunpowder",
                "de-DE": "Schwarzpulver",
            },
        },
    },
    {
        id: "brassparts",
        createTime: 20,
        output: 2,
        requires: [],
        toolset: {
            type: "machine",
            minimumTool: MachineToolset.machine,
            maximumTool: MachineToolset.machine,
        },
        creatorID: "metallathe",
        i18n: {
            creator: {
                "en-US": "Metal Lathe Operator",
                "de-DE": "Metall-Drehmaschinenbediener",
            },
            name: {
                "en-US": "Brass Parts",
                "de-DE": "Messingteile",
            },
        },
    },
];

const expectedMineableItems: Items = [
    {
        id: "goldore",
        createTime: 20,
        output: 1,
        requires: [],
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.steel,
        },
        creatorID: "minerjob",
        i18n: {
            creator: {
                "en-US": "Miner",
                "de-DE": "Bergarbeiter",
            },
            name: {
                "en-US": "Gold Ore",
                "de-DE": "Golderz",
            },
        },
    },
];

const expectedGrowables: Items = [
    {
        id: "wheat",
        createTime: 20,
        output: 1,
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
        i18n: {
            creator: {
                "en-US": "Wheat Farmer",
                "de-DE": "Weizenbauer",
            },
            name: {
                "en-US": "Wheat",
                "de-DE": "Weizen",
            },
        },
    },
];

const convertToUntranslatedItem = (item: Items): UntranslatedItem[] => {
    return item.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { i18n, ...rest } = item;
        return rest;
    });
};

const consoleLogSpy = vi
    .spyOn(console, "log")
    .mockImplementation(() => undefined);

beforeEach(() => {
    mockConvertCrafteableRecipes.mockResolvedValue(
        convertToUntranslatedItem(expectedCraftableRecipes),
    );
    mockConvertMineableItems.mockResolvedValue(
        convertToUntranslatedItem(expectedMineableItems),
    );
    mockConvertGrowables.mockResolvedValue(
        convertToUntranslatedItem(expectedGrowables),
    );
    mockConvertLocalisation.mockResolvedValue(localisationOutput);
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

test("converts localisation files in provided directory", async () => {
    await convertRecipes(input);

    expect(mockConvertLocalisation).toHaveBeenCalledTimes(1);
    expect(mockConvertLocalisation).toHaveBeenCalledWith({
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
        expectedCraftableRecipes,
    );
});

test("only writes returned mineable items to provided JSON output path if only mineable items returned", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);
    mockConvertGrowables.mockResolvedValue([]);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expectedMineableItems,
    );
});

test("only writes returned growable items to provided JSON output path if only growable items returned", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);
    mockConvertMineableItems.mockResolvedValue([]);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expectedGrowables,
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
        expect.arrayContaining(expected),
    );
});

describe("handles directly non-creatable items", () => {
    const itemWithUnknownRequirement: UntranslatedItem = {
        id: "wheat",
        createTime: 2,
        requires: [{ id: "unknown", amount: 1 }],
        output: 1,
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.steel,
        },
        creatorID: "wheatfarmer",
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
            expect.arrayContaining([itemWithUnknownRequirement]),
        );
    });

    test("writes a message to console to indicate recipe removed", async () => {
        await convertRecipes(input);

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            `Removed recipe: ${itemWithUnknownRequirement.id} from ${itemWithUnknownRequirement.creatorID} as depends on item that cannot be created`,
        );
    });
});

describe("handles non-creatable items due to nested unknown item", () => {
    const itemWithUnknownRequirement: UntranslatedItem = {
        id: "wheat",
        createTime: 2,
        requires: [{ id: "unknown", amount: 1 }],
        output: 1,
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.steel,
        },
        creatorID: "wheatfarmer",
    };
    const itemWithNestedUnknownRequirement: UntranslatedItem = {
        id: "gunpowder",
        createTime: 2,
        requires: [{ id: itemWithUnknownRequirement.id, amount: 1 }],
        output: 1,
        toolset: {
            type: "default",
            minimumTool: DefaultToolset.none,
            maximumTool: DefaultToolset.steel,
        },
        creatorID: "alchemist",
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
            expect.arrayContaining([itemWithNestedUnknownRequirement]),
        );
        expect(mockWriteJSON).not.toHaveBeenCalledWith(
            input.outputFilePath,
            expect.arrayContaining([itemWithUnknownRequirement]),
        );
    });

    test("writes a message to console to indicate recipe removed", async () => {
        await convertRecipes(input);

        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            `Removed recipe: ${itemWithUnknownRequirement.id} from ${itemWithUnknownRequirement.creatorID} as depends on item that cannot be created`,
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            `Removed recipe: ${itemWithNestedUnknownRequirement.id} from ${itemWithNestedUnknownRequirement.creatorID} as depends on item that cannot be created`,
        );
    });
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

test("throws error if no localisation data returned", async () => {
    mockConvertLocalisation.mockResolvedValue({
        locales: new Set(),
        data: {
            creators: {},
            items: {},
        },
    });

    expect.assertions(1);
    await expect(convertRecipes(input)).rejects.toThrowError(
        "No localisation data available",
    );
});

test("ignores any locale that has missing item translations", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);
    mockConvertGrowables.mockResolvedValue([]);
    const incompleteLocalisationData: FlattenedLocalisation = {
        creators: {
            minerjob: {
                "en-US": "Miner",
                "de-DE": "Bergarbeiter",
            },
        },
        items: {
            goldore: {
                "de-DE": "Golderz",
            },
        },
    };
    const incompleteLocalisationOutput: LocalisationConverterOutput = {
        locales: new Set(["en-US", "de-DE"]),
        data: incompleteLocalisationData,
    };
    const expected: Items = [
        {
            id: "goldore",
            createTime: 20,
            output: 1,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            },
            creatorID: "minerjob",
            i18n: {
                creator: {
                    "de-DE": "Bergarbeiter",
                },
                name: {
                    "de-DE": "Golderz",
                },
            },
        },
    ];
    mockConvertLocalisation.mockResolvedValue(incompleteLocalisationOutput);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expect.arrayContaining(expected),
    );
});

test("ignores any locale that has missing creator translations", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);
    mockConvertGrowables.mockResolvedValue([]);
    const incompleteLocalisationData: FlattenedLocalisation = {
        creators: {
            minerjob: {
                "de-DE": "Bergarbeiter",
            },
        },
        items: {
            goldore: {
                "en-US": "Gold Ore",
                "de-DE": "Golderz",
            },
        },
    };
    const incompleteLocalisationOutput: LocalisationConverterOutput = {
        locales: new Set(["en-US", "de-DE"]),
        data: incompleteLocalisationData,
    };
    const expected: Items = [
        {
            id: "goldore",
            createTime: 20,
            output: 1,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            },
            creatorID: "minerjob",
            i18n: {
                creator: {
                    "de-DE": "Bergarbeiter",
                },
                name: {
                    "de-DE": "Golderz",
                },
            },
        },
    ];
    mockConvertLocalisation.mockResolvedValue(incompleteLocalisationOutput);

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expect.arrayContaining(expected),
    );
});

test("ignores locales that had previously missing item translations but are complete in later items", async () => {
    mockConvertGrowables.mockResolvedValue([]);
    mockConvertMineableItems.mockResolvedValue([]);
    const incompleteLocalisationData: FlattenedLocalisation = {
        creators: {
            alchemist: {
                "en-US": "Alchemist",
                "de-DE": "Alchemist",
            },
            metallathe: {
                "en-US": "Metal Lathe Operator",
                "de-DE": "Metall-Drehmaschinenbediener",
            },
        },
        items: {
            poisondart: {
                "en-US": "Poison Dart",
                // Missing de-DE
            },
            gunpowder: {
                "en-US": "Gunpowder",
                "de-DE": "Schwarzpulver",
            },
            brassparts: {
                "en-US": "Brass Parts",
                "de-DE": "Messingteile",
            },
        },
    };
    const incompleteLocalisationOutput: LocalisationConverterOutput = {
        locales: new Set(["en-US", "de-DE"]),
        data: incompleteLocalisationData,
    };
    mockConvertLocalisation.mockResolvedValue(incompleteLocalisationOutput);

    const expected: Items = [
        {
            id: "gunpowder",
            createTime: 25,
            output: 1,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.none,
            },
            creatorID: "alchemist",
            i18n: {
                creator: {
                    "en-US": "Alchemist",
                },
                name: {
                    "en-US": "Gunpowder",
                },
            },
        },
        {
            id: "brassparts",
            createTime: 20,
            output: 2,
            requires: [],
            toolset: {
                type: "machine",
                minimumTool: MachineToolset.machine,
                maximumTool: MachineToolset.machine,
            },
            creatorID: "metallathe",
            i18n: {
                creator: {
                    "en-US": "Metal Lathe Operator",
                },
                name: {
                    "en-US": "Brass Parts",
                },
            },
        },
    ];

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expect.arrayContaining(expected),
    );
});

test("ignores locales that had previously missing creator translations but are complete in later items", async () => {
    mockConvertGrowables.mockResolvedValue([]);
    mockConvertMineableItems.mockResolvedValue([]);
    const incompleteLocalisationData: FlattenedLocalisation = {
        creators: {
            alchemist: {
                "en-US": "Alchemist",
                // Missing de-DE
            },
            metallathe: {
                "en-US": "Metal Lathe Operator",
                "de-DE": "Metall-Drehmaschinenbediener",
            },
        },
        items: {
            poisondart: {
                "en-US": "Poison Dart",
                "de-DE": "Giftpfeil",
            },
            gunpowder: {
                "en-US": "Gunpowder",
                "de-DE": "Schwarzpulver",
            },
            brassparts: {
                "en-US": "Brass Parts",
                "de-DE": "Messingteile",
            },
        },
    };
    const incompleteLocalisationOutput: LocalisationConverterOutput = {
        locales: new Set(["en-US", "de-DE"]),
        data: incompleteLocalisationData,
    };
    mockConvertLocalisation.mockResolvedValue(incompleteLocalisationOutput);

    const expected: Items = [
        {
            id: "gunpowder",
            createTime: 25,
            output: 1,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.none,
            },
            creatorID: "alchemist",
            i18n: {
                creator: {
                    "en-US": "Alchemist",
                },
                name: {
                    "en-US": "Gunpowder",
                },
            },
        },
        {
            id: "brassparts",
            createTime: 20,
            output: 2,
            requires: [],
            toolset: {
                type: "machine",
                minimumTool: MachineToolset.machine,
                maximumTool: MachineToolset.machine,
            },
            creatorID: "metallathe",
            i18n: {
                creator: {
                    "en-US": "Metal Lathe Operator",
                },
                name: {
                    "en-US": "Brass Parts",
                },
            },
        },
    ];

    await convertRecipes(input);

    expect(mockWriteJSON).toHaveBeenCalledTimes(1);
    expect(mockWriteJSON).toHaveBeenCalledWith(
        input.outputFilePath,
        expect.arrayContaining(expected),
    );
});

test("throws error if no localisation data for specific creator", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);
    mockConvertGrowables.mockResolvedValue([]);
    const incompleteLocalisationData: FlattenedLocalisation = {
        creators: {
            // minerjob missing
        },
        items: {
            goldore: {
                "en-US": "Gold Ore",
                "de-DE": "Golderz",
            },
        },
    };
    const incompleteLocalisationOutput: LocalisationConverterOutput = {
        locales: new Set(["en-US", "de-DE"]),
        data: incompleteLocalisationData,
    };
    mockConvertLocalisation.mockResolvedValue(incompleteLocalisationOutput);

    expect.assertions(1);
    await expect(convertRecipes(input)).rejects.toThrowError(
        "Missing localisation data for creator: minerjob",
    );
});

test("throws error if no localisation data for specific item", async () => {
    mockConvertCrafteableRecipes.mockResolvedValue([]);
    mockConvertGrowables.mockResolvedValue([]);
    const incompleteLocalisationData: FlattenedLocalisation = {
        creators: {
            minerjob: {
                "en-US": "Miner",
                "de-DE": "Bergarbeiter",
            },
        },
        items: {
            // goldore missing
        },
    };
    const incompleteLocalisationOutput: LocalisationConverterOutput = {
        locales: new Set(["en-US", "de-DE"]),
        data: incompleteLocalisationData,
    };
    mockConvertLocalisation.mockResolvedValue(incompleteLocalisationOutput);

    expect.assertions(1);
    await expect(convertRecipes(input)).rejects.toThrowError(
        "Missing localisation data for item: goldore",
    );
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
