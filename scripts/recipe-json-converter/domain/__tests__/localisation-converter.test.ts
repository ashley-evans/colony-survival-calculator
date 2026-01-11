import path from "path";
import { vi } from "vitest";
import { when } from "vitest-when";

import { convertLocalisationFiles as baseConvertLocalisationFiles } from "../localisation-converter";
import {
    FlattenedLocalisation,
    LocalisationConverterInputs,
} from "../../interfaces/localisation-converter";
import { Localisation } from "../../types";

const mockFindFiles = vi.fn();
const mockReadLocalisationFile = vi.fn();

const convertLocalisationFiles = (input: LocalisationConverterInputs) =>
    baseConvertLocalisationFiles({
        ...input,
        findFiles: mockFindFiles,
        readLocalisationFile: mockReadLocalisationFile,
    });

const input: LocalisationConverterInputs = {
    inputDirectoryPath: path.join(__dirname, "test"),
};

const expectedLocalisationDirectory = path.join(
    input.inputDirectoryPath,
    "localization",
);
const expectedLocalisationFileFindInput = {
    root: expectedLocalisationDirectory,
    fileExtension: ".json",
};

const localisationFiles = [
    path.join(expectedLocalisationDirectory, "en-US.json"),
    path.join(expectedLocalisationDirectory, "de-DE.json"),
];

const englishLocalisation: Localisation = {
    sentences: {
        npcs: {
            pipliz: {
                alchemist: "Alchemist",
                metallathe: "Metal Lathe Operator",
                minerjob: "Miner",
                wheatfarmer: "Wheat Farmer",
                forester: "Forester",
            },
        },
    },
    types: {
        poisondart: "Poison Dart",
        gunpowder: "Gunpowder",
        brassparts: "Brass Parts",
        goldore: "Gold Ore",
        wheat: "Wheat",
    },
};

const germanLocalisation: Localisation = {
    sentences: {
        npcs: {
            pipliz: {
                alchemist: "Alchemist",
                metallathe: "Metall-Drehmaschinenbediener",
                minerjob: "Bergarbeiter",
                wheatfarmer: "Weizenbauer",
                forester: "Forstwirt",
            },
        },
    },
    types: {
        poisondart: "Giftpfeil",
        gunpowder: "Schwarzpulver",
        brassparts: "Messingteile",
        goldore: "Gold Erz",
        wheat: "Weizen",
    },
};

const expectedStaticTranslations: FlattenedLocalisation = {
    creators: {},
    items: {
        lantern: {
            "cs-CZ": "Lucerna",
            "da-DK": "Lanterne",
            "de-DE": "Laterne",
            "el-GR": "Φανάρι",
            "en-US": "Lantern",
            "es-ES": "Linterna",
            "fi-FI": "Lyhty",
            "fr-FR": "Lanterne",
            "it-IT": "Lanterna",
            "ja-JP": "ランタン",
            "ko-KR": "랜턴",
            "lt-LT": "Žibintas",
            "nl-NL": "Lantaarn",
            "no-NO": "Lykt",
            "pl-PL": "Latarnia",
            "pt-BR": "Lanterna",
            "ru-RU": "Фонарь",
            "th-TH": "โคมไฟ",
            "ua-UA": "Ліхтар",
            "vi-VN": "Đèn lồng",
            "zh-CN": "灯笼",
            "zh-TW": "燈籠",
        },
        log: {
            "cs-CZ": "Poleno",
            "da-DK": "Træstamme",
            "de-DE": "Baumstamm",
            "el-GR": "Κορμός",
            "en-US": "Log",
            "es-ES": "Leño",
            "fi-FI": "Hirsi",
            "fr-FR": "Bûche",
            "it-IT": "Ceppo",
            "ja-JP": "丸太",
            "ko-KR": "통나무",
            "lt-LT": "Rąstas",
            "nl-NL": "Boomstam",
            "no-NO": "Tømmerstokk",
            "pl-PL": "Kłoda",
            "pt-BR": "Tora",
            "ru-RU": "Бревно",
            "th-TH": "ท่อนไม้",
            "uk-UA": "Колода",
            "vi-VN": "Khúc gỗ",
            "zh-CN": "原木",
            "zh-TW": "原木",
        },
        leaves: {
            "cs-CZ": "Listí",
            "da-DK": "Blade",
            "de-DE": "Blätter",
            "el-GR": "Φύλλα",
            "en-US": "Leaves",
            "es-ES": "Hojas",
            "fi-FI": "Lehdet",
            "fr-FR": "Feuilles",
            "it-IT": "Foglie",
            "ja-JP": "葉",
            "ko-KR": "나뭇잎",
            "lt-LT": "Lapai",
            "nl-NL": "Bladeren",
            "no-NO": "Blader",
            "pl-PL": "Liście",
            "pt-BR": "Folhas",
            "ru-RU": "Листья",
            "th-TH": "ใบไม้",
            "uk-UA": "Листя",
            "vi-VN": "Lá",
            "zh-CN": "树叶",
            "zh-TW": "樹葉",
        },
    },
};

beforeEach(() => {
    when(mockFindFiles)
        .calledWith(expectedLocalisationFileFindInput)
        .thenResolve(localisationFiles);
    when(mockReadLocalisationFile)
        .calledWith(localisationFiles[0])
        .thenResolve(englishLocalisation);
    when(mockReadLocalisationFile)
        .calledWith(localisationFiles[1])
        .thenResolve(germanLocalisation);
});

test("finds localisation files in the provided input directory", async () => {
    await convertLocalisationFiles(input);

    expect(mockFindFiles).toHaveBeenCalledTimes(1);
    expect(mockFindFiles).toHaveBeenCalledWith(
        expectedLocalisationFileFindInput,
    );
});

test("throws an error if no localisation files found", async () => {
    mockFindFiles.mockResolvedValueOnce([]);

    expect.assertions(1);
    await expect(convertLocalisationFiles(input)).rejects.toThrowError(
        "No localisation JSON files found in provided directory",
    );
});

test("parses the JSON found in the localisation files", async () => {
    await convertLocalisationFiles(input);

    expect(mockReadLocalisationFile).toHaveBeenCalledTimes(
        localisationFiles.length,
    );
    for (const file of localisationFiles) {
        expect(mockReadLocalisationFile).toHaveBeenCalledWith(file);
    }
});

// Locales available: cs-CZ, da-DK, de-DE, el-GR, en-US, es-ES, fi-FI, fr-FR, it-IT, ja-JP, ko-KR, lt-LT, nl-NL, no-NO, pl-PL, pt-BR, ru-RU, th-TH, ua-UA, vi-VN, zh-CN, zh-TW

test("always returns static log and leaves localisation regardless of whether included in localisation files", async () => {
    const emptyLocalisation: Localisation = {
        sentences: { npcs: { pipliz: {} } },
        types: {},
    };
    mockReadLocalisationFile.mockResolvedValue(emptyLocalisation);

    const result = await convertLocalisationFiles(input);

    expect(result.data).toEqual(expectedStaticTranslations);
});

test("raises exception if locale outside known static locales found", async () => {
    const unknownValidLocale = "hi-IN";
    const invalidLocalisationFiles = [
        path.join(expectedLocalisationDirectory, `${unknownValidLocale}.json`),
    ];
    when(mockFindFiles)
        .calledWith(expectedLocalisationFileFindInput)
        .thenResolve(invalidLocalisationFiles);

    expect.assertions(1);
    await expect(convertLocalisationFiles(input)).rejects.toThrowError(
        `Valid locale found outside known static locales: ${unknownValidLocale}`,
    );
});

test("returns combined parsed localisation data", async () => {
    const expected: FlattenedLocalisation = {
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
            ...expectedStaticTranslations.creators,
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
                "de-DE": "Gold Erz",
            },
            wheat: {
                "en-US": "Wheat",
                "de-DE": "Weizen",
            },
            ...expectedStaticTranslations.items,
        },
    };

    const result = await convertLocalisationFiles(input);

    expect(result.locales).toEqual(new Set(["en-US", "de-DE"]));
    expect(result.data).toEqual(expected);
});

test("filters out localisation data with pipliz missing prefix", async () => {
    const expectedMissingPrefix = "_MISSING_";
    const localisationWithMissingPiplizMarker: Localisation = {
        sentences: {
            npcs: {
                pipliz: {
                    alchemist: "Alchemist",
                    metallathe: "Metall-Drehmaschinenbediener",
                    minerjob: `${expectedMissingPrefix}Miner`,
                    wheatfarmer: "Weizenbauer",
                    forester: `${expectedMissingPrefix}Forester`,
                },
            },
        },
        types: {
            poisondart: "Giftpfeil",
            gunpowder: `${expectedMissingPrefix}Schwarzpulver`,
            brassparts: "Messingteile",
            goldore: `${expectedMissingPrefix}Gold Erz`,
            wheat: "Weizen",
        },
    };

    const expected: FlattenedLocalisation = {
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
            },
            wheatfarmer: {
                "en-US": "Wheat Farmer",
                "de-DE": "Weizenbauer",
            },
            forester: {
                "en-US": "Forester",
            },
            ...expectedStaticTranslations.creators,
        },
        items: {
            poisondart: {
                "en-US": "Poison Dart",
                "de-DE": "Giftpfeil",
            },
            gunpowder: {
                "en-US": "Gunpowder",
            },
            brassparts: {
                "en-US": "Brass Parts",
                "de-DE": "Messingteile",
            },
            goldore: {
                "en-US": "Gold Ore",
            },
            wheat: {
                "en-US": "Wheat",
                "de-DE": "Weizen",
            },
            ...expectedStaticTranslations.items,
        },
    };

    when(mockReadLocalisationFile)
        .calledWith(localisationFiles[1])
        .thenResolve(localisationWithMissingPiplizMarker);

    const result = await convertLocalisationFiles(input);

    expect(result.locales).toEqual(new Set(["en-US", "de-DE"]));
    expect(result.data).toEqual(expected);
});

test("throws error if localisation file has invalid name", async () => {
    const invalidLocale = "unknown";
    const invalidLocalisationFiles = [
        path.join(expectedLocalisationDirectory, `${invalidLocale}.json`),
    ];
    when(mockFindFiles)
        .calledWith(expectedLocalisationFileFindInput)
        .thenResolve(invalidLocalisationFiles);

    expect.assertions(1);
    await expect(convertLocalisationFiles(input)).rejects.toThrowError(
        `Invalid localisation file name: ${invalidLocale}.json`,
    );
});

test("throws error if duplicate locale files found", async () => {
    const duplicateLocale = "en-US";
    const duplicateLocalisationFiles = [
        path.join(expectedLocalisationDirectory, `${duplicateLocale}.json`),
        path.join(expectedLocalisationDirectory, `${duplicateLocale}.json`),
    ];
    when(mockFindFiles)
        .calledWith(expectedLocalisationFileFindInput)
        .thenResolve(duplicateLocalisationFiles);

    expect.assertions(1);
    await expect(convertLocalisationFiles(input)).rejects.toThrowError(
        `Duplicate localisation files found for locale: ${duplicateLocale}`,
    );
});
