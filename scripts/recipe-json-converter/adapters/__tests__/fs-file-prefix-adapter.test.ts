import path from "path";
import fs from "fs";

import { findFiles } from "../fs-file-prefix-adapter";
import { createDirectory, emptyDirectory } from "./utils";

const tempDirectory = path.join(__dirname, "./temp");

describe("invalid root path handling", () => {
    test("throws an error if the provided root path does not exist", async () => {
        expect.assertions(1);
        await expect(findFiles({ root: tempDirectory })).rejects.toThrowError(
            `Provided folder: ${tempDirectory} is not valid`
        );
    });

    test("throws an error if the provided root path is not a directory", async () => {
        fs.writeFileSync(tempDirectory, "");

        expect.assertions(1);
        await expect(findFiles({ root: tempDirectory })).rejects.toThrowError(
            `Provided folder: ${tempDirectory} is not valid`
        );
    });

    afterEach(() => {
        fs.rmSync(tempDirectory, { recursive: true, force: true });
    });
});

describe("valid root path handling", () => {
    beforeAll(() => {
        createDirectory(tempDirectory);
    });

    beforeEach(() => {
        emptyDirectory(tempDirectory);
    });

    test("returns no files given no files in provided folder", async () => {
        const actual = await findFiles({ root: tempDirectory });

        expect(actual).toEqual([]);
    });

    test.each([
        [
            "all files (no extension filter)",
            "a single file stored",
            ["test.txt"],
            ["test.txt"],
            undefined,
            undefined,
        ],
        [
            "all files (no extension filter)",
            "multiple files stored",
            ["test-1.txt", "test-2.txt"],
            ["test-1.txt", "test-2.txt"],
            undefined,
            undefined,
        ],
        [
            "matching files with .json extension",
            "multiple files with multiple extensions",
            ["test-1.txt", "test-2.json"],
            ["test-2.json"],
            ".json",
            undefined,
        ],
        [
            "matching files with test- prefix",
            "multiple files with different prefixes",
            ["test-1.txt", "different-2.json"],
            ["test-1.txt"],
            undefined,
            "test-",
        ],
        [
            "matching files with test- prefix and .json extension",
            "multiple files with different prefixes",
            ["test-1.txt", "test-2.json"],
            ["test-1.txt"],
            ".txt",
            "test-",
        ],
    ])(
        "returns absolute paths for %s given %s",
        async (
            _: string,
            __: string,
            files: string[],
            expected: string[],
            extension?: string,
            prefix?: string
        ) => {
            for (const file of files) {
                const filePath = path.join(tempDirectory, file);
                fs.writeFileSync(filePath, "");
            }

            const actual = await findFiles({
                root: tempDirectory,
                fileExtension: extension,
                prefix,
            });

            expect(actual).toHaveLength(expected.length);
            for (const file of expected) {
                const filePath = path.join(tempDirectory, file);
                expect(actual).toContainEqual(filePath);
            }
        }
    );

    afterAll(() => {
        fs.rmSync(tempDirectory, { recursive: true, force: true });
    });
});
