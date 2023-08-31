import fs from "fs/promises";
import path from "path";

import { FilePrefixFinder } from "../interfaces/file-prefix-finder";

const checkDirectoryExists = async (filePath: string): Promise<boolean> => {
    try {
        const stats = await fs.stat(filePath);
        return stats.isDirectory();
    } catch {
        return false;
    }
};

const findFiles: FilePrefixFinder = async ({ root, fileExtension, prefix }) => {
    const folderExists = await checkDirectoryExists(root);
    if (!folderExists) {
        throw new Error(`Provided folder: ${root} is not valid`);
    }

    const paths = await fs.readdir(root);
    const filteredExtensions = fileExtension
        ? paths.filter((current) => current.endsWith(fileExtension))
        : paths;
    const filteredPrefixes = prefix
        ? filteredExtensions.filter((current) => current.startsWith(prefix))
        : filteredExtensions;
    return filteredPrefixes.map((current) => path.join(root, current));
};

export { findFiles };
