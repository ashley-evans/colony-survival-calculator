import { queryRequirements } from "../query-requirements";
// import { queryRequirements as mongoDBQueryRequirements } from "../../adapters/mongodb-requirements-adapter";

jest.mock("../../adapters/mongodb-requirements-adapter", () => ({
    queryRequirements: jest.fn(),
}));

// const mocKMongoDBQueryRequirements = mongoDBQueryRequirements as jest.Mock;

const validItemName = "test item name";
const validAmount = 1;

test("throws an error given an empty string as an item name", async () => {
    const expectedError = new Error(
        "Invalid item name provided, must be a non-empty string"
    );

    expect.assertions(1);
    await expect(queryRequirements("", validAmount)).rejects.toThrow(
        expectedError
    );
});

test.each([
    ["equal to zero", 0],
    ["less than zero", -1],
])(
    "throws an error given amount that is %s",
    async (_: string, amount: number) => {
        const expectedError = new Error(
            "Invalid amount provided, must be a positive number"
        );

        expect.assertions(1);
        await expect(queryRequirements(validItemName, amount)).rejects.toThrow(
            expectedError
        );
    }
);
