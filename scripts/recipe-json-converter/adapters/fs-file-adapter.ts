import fs from "fs/promises";
import path from "path";

import { FileFinder } from "../interfaces/file-finder";

const checkDirectoryExists = async (filePath: string): Promise<boolean> => {
    try {
        const stats = await fs.stat(filePath);
        return stats.isDirectory();
    } catch {
        return false;
    }
};

const removeExtension = (file: string): string => {
    const index = file.lastIndexOf(".");
    return index === -1 ? file : file.slice(0, index);
};

const findFiles: FileFinder = async ({ root, fileExtension, ...rest }) => {
    const folderExists = await checkDirectoryExists(root);
    if (!folderExists) {
        throw new Error(`Provided folder: ${root} is not valid`);
    }

    const paths = await fs.readdir(root);
    const filteredExtensions = fileExtension
        ? paths.filter((current) => current.endsWith(fileExtension))
        : paths;

    if ("exact" in rest && rest.exact) {
        return filteredExtensions
            .filter((current) => removeExtension(current) === rest.exact)
            .map((current) => path.join(root, current));
    } else if ("prefix" in rest && rest.prefix) {
        return filteredExtensions
            .filter((current) => current.startsWith(rest.prefix))
            .map((current) => path.join(root, current));
    }

    return filteredExtensions.map((current) => path.join(root, current));
};

export { findFiles };
