import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { vi } from "vitest";

import { createDirectory, readJSONFile } from "./utils";
import { writeJSONToFile } from "../json-file-writer";

const tempDirectory = path.join(__dirname, "./temp/json-file-writer");
const expectedFilePath = path.join(tempDirectory, "test.json");
const expectedContent = { test: "test" };

beforeAll(() => {
    createDirectory(tempDirectory);
});

test("writes the provided content to the provided path", async () => {
    await writeJSONToFile(expectedFilePath, expectedContent);
    const actual = readJSONFile(expectedFilePath);

    expect(actual).toEqual(expectedContent);
});

test("returns true if the provided content was successfully written to file", async () => {
    const actual = await writeJSONToFile(expectedFilePath, expectedContent);

    expect(actual).toEqual(true);
});

test("returns false if an error occurs writing content to file", async () => {
    const expectedError = new Error("Test Error");
    vi.spyOn(fsPromises, "writeFile").mockRejectedValueOnce(expectedError);

    const actual = await writeJSONToFile(expectedFilePath, expectedContent);

    expect(actual).toEqual(false);
});

afterAll(() => {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
});
