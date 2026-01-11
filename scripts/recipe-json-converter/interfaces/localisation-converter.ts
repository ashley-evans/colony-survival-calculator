import { Localisation } from "../types";
import { FileFinder } from "./file-finder";
import { JSONFileReader } from "./json-file-reader";

type LocalisationConverterDependencies = {
    findFiles: FileFinder;
    readLocalisationFile: JSONFileReader<Localisation>;
};

type LocalisationConverterInputs = {
    inputDirectoryPath: string;
};

type LocalisationConverterParameters = LocalisationConverterInputs &
    LocalisationConverterDependencies;

type FlattenedLocalisation = {
    creators: {
        [key: string]: {
            [key: string]: string;
        };
    };
    items: {
        [key: string]: {
            [key: string]: string;
        };
    };
};

type LocalisationConverterOutput = {
    locales: Set<string>;
    data: FlattenedLocalisation;
};

interface LocalisationConverter {
    (
        params: LocalisationConverterParameters,
    ): Promise<LocalisationConverterOutput>;
}

export type {
    LocalisationConverter,
    LocalisationConverterDependencies,
    LocalisationConverterInputs,
    LocalisationConverterOutput,
    LocalisationConverterParameters,
    FlattenedLocalisation,
};
