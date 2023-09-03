import fs from "fs/promises";

import { JSONWriter } from "../interfaces/json-writer";

const writeJSONToFile: JSONWriter = async (path, content) => {
    const stringifiedContent = JSON.stringify(content);

    try {
        await fs.writeFile(path, stringifiedContent, { encoding: "utf-8" });
    } catch {
        return false;
    }

    return true;
};

export { writeJSONToFile };
