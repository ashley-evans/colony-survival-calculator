type BaseFinderInput = {
    root: string;
    fileExtension?: string | undefined;
};

type PrefixFinderInput = BaseFinderInput & {
    prefix: string;
};

type ExactFinderInput = BaseFinderInput & {
    exact: string;
};

type FileFinderInput = BaseFinderInput | PrefixFinderInput | ExactFinderInput;

interface FileFinder {
    (input: FileFinderInput): Promise<string[]>;
}

export type { FileFinder };
