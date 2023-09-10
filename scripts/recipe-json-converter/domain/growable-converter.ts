import { FileFinder } from "../interfaces/file-finder";
import { GrowableConverter } from "../interfaces/growable-converter";
import { JSONFileReader } from "../interfaces/json-file-reader";
import { APITools, Growables, Item } from "../types";
import { JSON_FILE_EXTENSION } from "./constants";
import {
    getUserFriendlyCreatorName,
    getUserFriendlyItemName,
} from "./recipe-dictionary";
import { checkDuplication } from "./utils";

const FILE_NAME = "growables";
const GAME_DAY_SECONDS = 435;

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
    return {
        name: userFriendlyName,
        createTime,
        output: expectedOutput,
        requires: [],
        minimumTool: APITools.none,
        maximumTool: APITools.none,
        creator,
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

    const converted = growables.map((growable) => mapToItem(growable));
    const containsDuplicate = checkDuplication(converted);
    if (containsDuplicate.duplicateFound) {
        throw new Error(
            `Multiple growable recipes for item: ${containsDuplicate.name}, please remove one`
        );
    }

    return converted;
};

export { convertGrowables };
