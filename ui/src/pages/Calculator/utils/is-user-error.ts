import {
    RequirementResult,
    UserError,
} from "../../../graphql/__generated__/graphql";

function isUserError(input: RequirementResult): input is UserError {
    return "message" in input && input.__typename === "UserError";
}

export { isUserError };
