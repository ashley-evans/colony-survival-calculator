import { FileFinder } from "../interfaces/file-finder";
import { JSONFileReader } from "../interfaces/json-file-reader";
import { MineableItemConverter } from "../interfaces/mineable-item-converter";
import { DefaultToolset, MineableItems, UntranslatedItem } from "../types";
import { JSON_FILE_EXTENSION } from "./constants";
import { checkDuplication } from "./utils";

const FILE_NAME = "types";

const getMineableItems = async (
    inputDirectoryPath: string,
    findFiles: FileFinder,
    readMineableItemsFile: JSONFileReader<MineableItems>,
) => {
    const mineableItemsFiles = await findFiles({
        root: inputDirectoryPath,
        fileExtension: JSON_FILE_EXTENSION,
        exact: FILE_NAME,
    });

    if (mineableItemsFiles.length === 0) {
        throw new Error(
            `No ${FILE_NAME}${JSON_FILE_EXTENSION} file found in provided directory`,
        );
    } else if (mineableItemsFiles.length > 1) {
        throw new Error(
            `Multiple ${FILE_NAME}${JSON_FILE_EXTENSION} files found, ensure only one exists`,
        );
    }

    return readMineableItemsFile(mineableItemsFiles[0] as string);
};

const convertToItems = (mineable: MineableItems): UntranslatedItem[] => {
    return Object.values(mineable).reduce((acc, current) => {
        if (!current.customData?.minerMiningTime || !current.onRemoveType) {
            return acc;
        }

        acc.push({
            id: current.onRemoveType,
            createTime: current.customData.minerMiningTime,
            output: 1,
            requires: [],
            toolset: {
                type: "default",
                minimumTool: DefaultToolset.none,
                maximumTool: DefaultToolset.steel,
            },
            creatorID: "minerjob",
        });

        return acc;
    }, [] as UntranslatedItem[]);
};

const convertMineableItems: MineableItemConverter = async ({
    inputDirectoryPath,
    findFiles,
    readMineableItemsFile,
}) => {
    const mineable = await getMineableItems(
        inputDirectoryPath,
        findFiles,
        readMineableItemsFile,
    );

    const converted = convertToItems(mineable);
    const containsDuplicate = checkDuplication(converted);
    if (containsDuplicate.duplicateFound) {
        throw new Error(
            `Multiple mineable recipes for item: ${containsDuplicate.id}, please remove one`,
        );
    }

    return converted;
};

export { convertMineableItems };
