import type { QueryRequirementsPrimaryPort } from "../interfaces/query-requirements-primary-port";

const INVALID_ITEM_NAME_ERROR =
    "Invalid item name provided, must be a non-empty string";
const INVALID_AMOUNT_ERROR =
    "Invalid amount provided, must be a positive number";

const queryRequirements: QueryRequirementsPrimaryPort = async (
    name: string,
    amount: number
) => {
    if (name === "") {
        throw new Error(INVALID_ITEM_NAME_ERROR);
    }

    if (amount <= 0) {
        throw new Error(INVALID_AMOUNT_ERROR);
    }

    return [];
};

export { queryRequirements };
