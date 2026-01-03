import { MineableItems, UntranslatedItem } from "../types";
import { FileFinder } from "./file-finder";
import { JSONFileReader } from "./json-file-reader";

type MineableItemConverterDependencies = {
    findFiles: FileFinder;
    readMineableItemsFile: JSONFileReader<MineableItems>;
};

type MineableItemConverterInputs = {
    inputDirectoryPath: string;
};

type MineableItemConverterParameters = MineableItemConverterInputs &
    MineableItemConverterDependencies;

interface MineableItemConverter {
    (params: MineableItemConverterParameters): Promise<UntranslatedItem[]>;
}

export type {
    MineableItemConverter,
    MineableItemConverterDependencies,
    MineableItemConverterInputs,
    MineableItemConverterParameters,
};
