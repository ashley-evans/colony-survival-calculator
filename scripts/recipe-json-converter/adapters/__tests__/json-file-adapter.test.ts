import path from "path";
import fs from "fs";
import { JSONSchemaType } from "ajv";

import { factory } from "../json-file-adapter";

type TestType = {
    name: string;
};

const testSchema: JSONSchemaType<TestType> = {
    type: "object",
    properties: {
        name: { type: "string" },
    },
    required: ["name"],
    additionalProperties: false,
};

const adapter = factory(testSchema);

const tempDirectory = path.join(__dirname, "./temp");

const createDirectory = (directoryPath: string) => {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
    }
};

const writeJSONToFile = (path: string, content: unknown) => {
    fs.writeFileSync(path, JSON.stringify(content));
};

beforeAll(() => {
    createDirectory(tempDirectory);
});

test("throws an error if the provided file does not exist", async () => {
    const nonExistentFile = path.join(tempDirectory, "./does-not-exist");

    expect.assertions(1);
    await expect(adapter(nonExistentFile)).rejects.toThrowError(
        `File at path: ${nonExistentFile} does not exist`
    );
});

test("throws an error if the provided file is not a JSON file", async () => {
    const invalidFileExtension = path.join(
        tempDirectory,
        "./incorrect-file-extension.txt"
    );
    fs.writeFileSync(invalidFileExtension, "");

    expect.assertions(1);
    await expect(adapter(invalidFileExtension)).rejects.toThrowError(
        `File at path: ${invalidFileExtension} is not a .json file`
    );
});

test("throws an error if the JSON inside the file does not match the provided schema", async () => {
    const invalidJSONFile = path.join(
        tempDirectory,
        "invalid-json-schema.json"
    );
    writeJSONToFile(invalidJSONFile, { test: "test property value" });

    expect.assertions(1);
    await expect(adapter(invalidJSONFile)).rejects.toThrowError(
        `File at path: ${invalidJSONFile} does not match provided schema`
    );
});

test("returns the validated JSON object if JSON matches provided schema", async () => {
    const validJSONFile = path.join(tempDirectory, "valid-json.json");
    const expected: TestType = { name: "test name" };
    writeJSONToFile(validJSONFile, expected);

    const actual = await adapter(validJSONFile);

    expect(actual).toEqual(expected);
});

afterAll(() => {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
});
