export enum ErrorCode {
    INVALID_ITEM_ID = "INVALID_ITEM_ID",
    INVALID_WORKERS = "INVALID_WORKERS",
    INVALID_TARGET = "INVALID_TARGET",
    UNKNOWN_ITEM = "UNKNOWN_ITEM",
    TOOL_LEVEL = "TOOL_LEVEL",
    MULTIPLE_OVERRIDE = "MULTIPLE_OVERRIDE",
    INVALID_OVERRIDE_ITEM_NOT_CREATABLE = "INVALID_OVERRIDE_ITEM_NOT_CREATABLE",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export const ERROR_MESSAGE_MAPPING: Record<ErrorCode, string> = {
    [ErrorCode.INVALID_ITEM_ID]:
        "Invalid item ID provided, must be a non-empty string",
    [ErrorCode.INVALID_WORKERS]:
        "Invalid number of workers provided, must be a positive number",
    [ErrorCode.INVALID_TARGET]:
        "Invalid target output provided, must be a positive number",
    [ErrorCode.UNKNOWN_ITEM]: "Unknown item provided",
    [ErrorCode.TOOL_LEVEL]:
        "Unable to create item with available tools, please adjust your tool selection",
    [ErrorCode.MULTIPLE_OVERRIDE]:
        "Invalid input: More than one creator override provided for an item",
    [ErrorCode.INVALID_OVERRIDE_ITEM_NOT_CREATABLE]:
        "Invalid input, item is not creatable with current overrides",
    [ErrorCode.INTERNAL_SERVER_ERROR]: "Internal server error",
};

export class UserError extends Error {
    constructor(
        public code: ErrorCode,
        public details?: Record<string, string>,
    ) {
        super(ERROR_MESSAGE_MAPPING[code]);
    }
}
