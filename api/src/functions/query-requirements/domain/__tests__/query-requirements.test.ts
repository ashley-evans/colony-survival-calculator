import { queryRequirements } from "../query-requirements";
import { queryRequirements as mongoDBQueryRequirements } from "../../adapters/mongodb-requirements-adapter";
import { createItem } from "../../../../../test";

jest.mock("../../adapters/mongodb-requirements-adapter", () => ({
    queryRequirements: jest.fn(),
}));

const mockMongoDBQueryRequirements = mongoDBQueryRequirements as jest.Mock;

const validItemName = "test item name";
const validWorkers = 5;

beforeEach(() => {
    mockMongoDBQueryRequirements.mockReset();
});

test("throws an error given an empty string as an item name", async () => {
    const expectedError = new Error(
        "Invalid item name provided, must be a non-empty string"
    );

    expect.assertions(1);
    await expect(queryRequirements("", validWorkers)).rejects.toThrow(
        expectedError
    );
});

test.each([
    ["equal to zero", 0],
    ["less than zero", -1],
])(
    "throws an error given number of workers that is %s",
    async (_: string, amount: number) => {
        const expectedError = new Error(
            "Invalid number of workers provided, must be a positive number"
        );

        expect.assertions(1);
        await expect(queryRequirements(validItemName, amount)).rejects.toThrow(
            expectedError
        );
    }
);

test("calls the database adapter to get the requirements given valid input", async () => {
    const item = createItem(validItemName, 2, 3, []);
    mockMongoDBQueryRequirements.mockResolvedValue([item]);

    await queryRequirements(validItemName, validWorkers);

    expect(mockMongoDBQueryRequirements).toHaveBeenCalledTimes(1);
    expect(mockMongoDBQueryRequirements).toHaveBeenCalledWith(validItemName);
});

test("throws an error if no requirements are returned at all (item does not exist)", async () => {
    mockMongoDBQueryRequirements.mockResolvedValue([]);
    const expectedError = new Error("Unknown item provided");

    expect.assertions(1);
    await expect(
        queryRequirements(validItemName, validWorkers)
    ).rejects.toThrow(expectedError);
});

test("throws an error if the provided item details are not returned from DB", async () => {
    const item = createItem("another item", 2, 3, []);
    mockMongoDBQueryRequirements.mockResolvedValue([item]);
    const expectedError = new Error("Unknown item provided");

    expect.assertions(1);
    await expect(
        queryRequirements(validItemName, validWorkers)
    ).rejects.toThrow(expectedError);
});

test("returns an empty array if the provided item has no requirements", async () => {
    const item = createItem(validItemName, 2, 3, []);
    mockMongoDBQueryRequirements.mockResolvedValue([item]);

    const actual = await queryRequirements(validItemName, validWorkers);

    expect(actual).toEqual([]);
});

test("throws an error if provided item requires an item that does not exist in database", async () => {
    const item = createItem(validItemName, 2, 3, [
        { name: "unknown item", amount: 4 },
    ]);
    mockMongoDBQueryRequirements.mockResolvedValue([item]);
    const expectedError = new Error("Internal server error");

    expect.assertions(1);
    await expect(
        queryRequirements(validItemName, validWorkers)
    ).rejects.toThrow(expectedError);
});

test("returns requirement given item with a single requirement and no nested requirements", async () => {
    const requiredItem = createItem("required item", 3, 4, []);
    const item = createItem(validItemName, 2, 3, [
        { name: requiredItem.name, amount: 4 },
    ]);
    mockMongoDBQueryRequirements.mockResolvedValue([item, requiredItem]);

    const actual = await queryRequirements(validItemName, validWorkers);

    expect(actual).toHaveLength(1);
    expect(actual[0]?.name).toEqual(requiredItem.name);
    expect(actual[0]?.workers).toBeCloseTo(7.5);
});

test("returns requirement given item with multiple requirements and no nested requirements", async () => {
    const requiredItem1 = createItem("required item 1", 3, 4, []);
    const requiredItem2 = createItem("required item 2", 4, 2, []);
    const item = createItem(validItemName, 2, 3, [
        { name: requiredItem1.name, amount: 4 },
        { name: requiredItem2.name, amount: 6 },
    ]);
    mockMongoDBQueryRequirements.mockResolvedValue([
        item,
        requiredItem1,
        requiredItem2,
    ]);

    const actual = await queryRequirements(validItemName, validWorkers);

    expect(actual).toHaveLength(2);
    expect(actual).toEqual([
        { name: requiredItem1.name, workers: 7.5 },
        { name: requiredItem2.name, workers: 30 },
    ]);
});
