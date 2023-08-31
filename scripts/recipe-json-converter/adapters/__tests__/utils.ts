import fs from "fs";
import path from "path";

const createDirectory = (directoryPath: string) => {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
    }
};

const writeJSONToFile = (path: string, content: unknown) => {
    fs.writeFileSync(path, JSON.stringify(content));
};

const emptyDirectory = (directoryPath: string) => {
    const files = fs
        .readdirSync(directoryPath)
        .map((current) => path.join(directoryPath, current));
    for (const file of files) {
        fs.rmSync(file, { force: true });
    }
};

export { createDirectory, writeJSONToFile, emptyDirectory };
