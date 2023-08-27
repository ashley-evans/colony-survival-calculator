import fs from "fs/promises";
import path from "path";
import { JSONFileReader } from "../interfaces/json-file-reader";
import Ajv, { Schema } from "ajv";

const checkFileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.stat(filePath);
        return true;
    } catch {
        return false;
    }
};

const factory = <T>(schema: Schema): JSONFileReader<T> => {
    const ajv = new Ajv();
    const validate = ajv.compile<T>(schema);

    return async (filePath: string): Promise<T> => {
        const exists = await checkFileExists(filePath);
        if (!exists) {
            throw new Error(`File at path: ${filePath} does not exist`);
        }

        if (path.extname(filePath) !== ".json") {
            throw new Error(`File at path: ${filePath} is not a .json file`);
        }

        const content = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (validate(parsed)) {
            return parsed;
        }

        throw new Error(
            `File at path: ${filePath} does not match provided schema`
        );
    };
};

export { factory };
