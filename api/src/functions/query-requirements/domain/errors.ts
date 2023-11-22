const INVALID_ITEM_NAME_ERROR =
    "Invalid item name provided, must be a non-empty string";
const INVALID_WORKERS_ERROR =
    "Invalid number of workers provided, must be a positive number";
const INVALID_TARGET_ERROR =
    "Invalid target output provided, must be a positive number";
const UNKNOWN_ITEM_ERROR = "Unknown item provided";
const TOOL_LEVEL_ERROR_PREFIX = "Unable to create item with available tools,";
const MULTIPLE_OVERRIDE_ERROR_PREFIX =
    "Invalid input: More than one creator override provided for:";
const INVALID_OVERRIDE_ITEM_NOT_CREATABLE_ERROR =
    "Invalid input, item is not creatable with current overrides";
const INTERNAL_SERVER_ERROR = "Internal server error";

export {
    INVALID_ITEM_NAME_ERROR,
    INVALID_WORKERS_ERROR,
    INVALID_TARGET_ERROR,
    UNKNOWN_ITEM_ERROR,
    TOOL_LEVEL_ERROR_PREFIX,
    MULTIPLE_OVERRIDE_ERROR_PREFIX,
    INVALID_OVERRIDE_ITEM_NOT_CREATABLE_ERROR,
    INTERNAL_SERVER_ERROR,
};
