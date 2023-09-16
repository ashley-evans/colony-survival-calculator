import {
    OutputResult,
    RequirementResult,
    UserError,
} from "../../../graphql/__generated__/graphql";

function isUserError(
    input: RequirementResult | OutputResult
): input is UserError {
    return "message" in input && input.__typename === "UserError";
}

export { isUserError };
