interface FilePrefixFinder {
    (input: {
        root: string;
        prefix?: string | undefined;
        fileExtension?: string | undefined;
    }): Promise<string[]>;
}

export { FilePrefixFinder };
