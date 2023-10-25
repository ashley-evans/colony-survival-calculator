import { FileFinder } from "../interfaces/file-finder";
import { GrowableConverter } from "../interfaces/growable-converter";
import { JSONFileReader } from "../interfaces/json-file-reader";
import { APITools, Growables, Item, Items } from "../types";
import { JSON_FILE_EXTENSION } from "./constants";
import {
    getUserFriendlyCreatorName,
    getUserFriendlyItemName,
} from "./recipe-dictionary";
import { checkDuplication } from "./utils";

const FILE_NAME = "growables";
const GAME_DAY_SECONDS = 435;

const STATIC_RECIPES: Items = [
    {
        name: "Log",
        createTime: 435,
        output: 44,
        requires: [],
        optionalOutputs: [{ name: "Leaves", amount: 59.4, likelihood: 1 }],
        toolset: {
            type: "default",
            minimumTool: APITools.none,
            maximumTool: APITools.none,
        },
        creator: "Forester",
        size: {
            width: 3,
            height: 33,
        },
    },
    {
        name: "Leaves",
        createTime: 435,
        output: 59.4,
        requires: [],
        optionalOutputs: [{ name: "Log", amount: 44, likelihood: 1 }],
        toolset: {
            type: "default",
            minimumTool: APITools.none,
            maximumTool: APITools.none,
        },
        creator: "Forester",
        size: {
            width: 3,
            height: 33,
        },
    },
];

const getGrowables = async (
    inputDirectoryPath: string,
    findFiles: FileFinder,
    readGrowablesFile: JSONFileReader<Growables>
) => {
    const growablesFiles = await findFiles({
        root: inputDirectoryPath,
        fileExtension: JSON_FILE_EXTENSION,
        exact: FILE_NAME,
    });

    if (growablesFiles.length === 0) {
        throw new Error(
            `No ${FILE_NAME}${JSON_FILE_EXTENSION} file found in provided directory`
        );
    } else if (growablesFiles.length > 1) {
        throw new Error(
            `Multiple ${FILE_NAME}${JSON_FILE_EXTENSION} files found, ensure only one exists`
        );
    }

    return readGrowablesFile(growablesFiles[0] as string);
};

const getExpectedOutput = (name: string): number | null => {
    switch (name) {
        case "wisteriaplant":
            return 1;
        case "wheat":
        case "flax":
        case "cotton":
        case "cabbage":
        case "alkanet":
        case "hollyhock":
        case "wolfsbane":
        case "barley":
        case "hemp":
            return 100;
        default:
            return null;
    }
};

const getExpectedSize = (name: string): NonNullable<Item["size"]> | null => {
    switch (name) {
        case "wheat":
        case "flax":
        case "cotton":
        case "cabbage":
        case "alkanet":
        case "hollyhock":
        case "wolfsbane":
        case "barley":
        case "hemp":
            return { height: 10, width: 10 };
        default:
            return null;
    }
};

const mapToItem = (growable: Growables[number]): Item => {
    const userFriendlyName = getUserFriendlyItemName(growable.identifier);
    if (!userFriendlyName) {
        throw new Error(
            `User friendly name unavailable for growable: ${growable.identifier}`
        );
    }

    const creator = getUserFriendlyCreatorName(growable.identifier);
    if (!creator) {
        throw new Error(
            `User friendly creator name unavailable for growable: ${growable.identifier}`
        );
    }

    const expectedOutput = getExpectedOutput(growable.identifier);
    if (!expectedOutput) {
        throw new Error(
            `Expected output for growable: ${growable.identifier} not known`
        );
    }

    const daysToGrow = growable.stages.length - 1;
    if (daysToGrow <= 0) {
        throw new Error(
            `Provided growable: ${growable.identifier} grows in less than one day`
        );
    }

    const createTime = daysToGrow * GAME_DAY_SECONDS;
    const size = getExpectedSize(growable.identifier);
    return {
        name: userFriendlyName,
        createTime,
        output: expectedOutput,
        requires: [],
        toolset: {
            type: "default",
            minimumTool: APITools.none,
            maximumTool: APITools.none,
        },
        creator,
        ...(size ? { size } : {}),
    };
};

const convertGrowables: GrowableConverter = async ({
    inputDirectoryPath,
    findFiles,
    readGrowablesFile,
}) => {
    const growables = await getGrowables(
        inputDirectoryPath,
        findFiles,
        readGrowablesFile
    );

    const converted = growables
        .map((growable) => mapToItem(growable))
        .concat(STATIC_RECIPES);
    const containsDuplicate = checkDuplication(converted);
    if (containsDuplicate.duplicateFound) {
        throw new Error(
            `Multiple growable recipes for item: ${containsDuplicate.name}, please remove one`
        );
    }

    return converted;
};

export { convertGrowables };
