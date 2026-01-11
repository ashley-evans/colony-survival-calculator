import {
    OutputResult,
    RequirementResult,
    UserError,
} from "../../../graphql/__generated__/graphql";

function isUserError(
    input: RequirementResult | OutputResult,
): input is UserError {
    return input.__typename === "UserError";
}

export { isUserError };
