import path from "path";
import {
    FlattenedLocalisation,
    LocalisationConverter,
} from "../interfaces/localisation-converter";
import { Localisation } from "../types";

const MISSING_PREFIX = "_MISSING_";
const STATIC_TRANSLATIONS: FlattenedLocalisation = {
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
const EXPECTED_STATIC_LOCALES = new Set<string>(
    Object.keys(STATIC_TRANSLATIONS.items["log"] ?? {}),
);

const parseLocalisationFileName = (filePath: string): string => {
    const fileName = path.basename(filePath, ".json");

    if (Intl.DateTimeFormat.supportedLocalesOf([fileName]).length === 0) {
        throw new Error(`Invalid localisation file name: ${fileName}.json`);
    }

    return fileName;
};

const flattenLocalisationData = (
    localisationData: [string, Localisation][],
): FlattenedLocalisation => {
    const flattened: FlattenedLocalisation = { creators: {}, items: {} };

    for (const [locale, data] of localisationData) {
        const localeKey = locale.toString();

        for (const [creatorID, creatorName] of Object.entries(
            data.sentences.npcs.pipliz,
        )) {
            if (creatorName.startsWith(MISSING_PREFIX)) {
                continue;
            }

            if (!flattened.creators[creatorID]) {
                flattened.creators[creatorID] = {};
            }

            flattened.creators[creatorID][localeKey] = creatorName;
        }

        for (const [itemID, itemName] of Object.entries(data.types)) {
            if (itemName.startsWith(MISSING_PREFIX)) {
                continue;
            }

            if (!flattened.items[itemID]) {
                flattened.items[itemID] = {};
            }

            flattened.items[itemID][localeKey] = itemName;
        }
    }

    return flattened;
};

const convertLocalisationFiles: LocalisationConverter = async ({
    inputDirectoryPath,
    findFiles,
    readLocalisationFile,
}) => {
    const localisationDirectory = path.join(inputDirectoryPath, "localization");
    const localisationFiles = await findFiles({
        root: localisationDirectory,
        fileExtension: ".json",
    });

    if (localisationFiles.length === 0) {
        throw new Error(
            `No localisation JSON files found in provided directory`,
        );
    }

    const deduplicated = new Set<string>();
    for (const filePath of localisationFiles) {
        if (deduplicated.has(filePath)) {
            throw new Error(
                `Duplicate localisation files found for locale: ${path.basename(filePath)}`,
            );
        }

        deduplicated.add(filePath);
    }

    const parsedLocalisationData: [string, Localisation][] = await Promise.all(
        Array.from(deduplicated).map(async (filePath) => [
            parseLocalisationFileName(filePath),
            await readLocalisationFile(filePath),
        ]),
    );

    const flattenedData = flattenLocalisationData(parsedLocalisationData);
    const mergedData: FlattenedLocalisation = {
        creators: {
            ...STATIC_TRANSLATIONS.creators,
            ...flattenedData.creators,
        },
        items: { ...STATIC_TRANSLATIONS.items, ...flattenedData.items },
    };

    const locales = new Set<string>(
        parsedLocalisationData.map(([locale]) => locale),
    );
    for (const locale of locales) {
        if (!EXPECTED_STATIC_LOCALES.has(locale)) {
            throw new Error(
                `Valid locale found outside known static locales: ${locale}`,
            );
        }
    }

    return {
        locales: new Set(parsedLocalisationData.map(([locale]) => locale)),
        data: mergedData,
    };
};

export { convertLocalisationFiles };
