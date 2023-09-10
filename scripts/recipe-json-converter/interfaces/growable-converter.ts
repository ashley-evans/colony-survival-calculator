import { Growables, Items } from "../types";
import { FileFinder } from "./file-finder";
import { JSONFileReader } from "./json-file-reader";

type GrowableConverterDependencies = {
    findFiles: FileFinder;
    readGrowablesFile: JSONFileReader<Growables>;
};

type GrowableConverterInputs = {
    inputDirectoryPath: string;
};

type GrowableConverterParameters = GrowableConverterInputs &
    GrowableConverterDependencies;

interface GrowableConverter {
    (params: GrowableConverterParameters): Promise<Items>;
}

export type {
    GrowableConverter,
    GrowableConverterDependencies,
    GrowableConverterInputs,
    GrowableConverterParameters,
};
