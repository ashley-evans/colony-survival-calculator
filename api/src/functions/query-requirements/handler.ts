import { ToolSchemaMap } from "../../common/modifiers";
import { OutputUnit } from "../../common/output";
import type { QueryRequirementArgs, Requirement } from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryRequirements } from "./domain/query-requirements";

const INVALID_ARGUMENT_ERROR =
    "Invalid arguments: Must provide output unit when querying amounts";

const amountFields = new Set([
    "amount",
    "creators/amount",
    "creators/demands/amount",
]);

const handler: GraphQLEventHandler<
    QueryRequirementArgs,
    Requirement[]
> = async (event) => {
    const { name, workers, unit, maxAvailableTool, creatorOverrides } =
        event.arguments;
    const { selectionSetList } = event.info;

    const selectedAmountFields = selectionSetList.filter((value) =>
        amountFields.has(value)
    );

    if (selectedAmountFields.length > 0 && !unit) {
        throw new Error(INVALID_ARGUMENT_ERROR);
    }

    return await queryRequirements({
        name,
        workers,
        ...(unit ? { unit: OutputUnit[unit] } : {}),
        ...(maxAvailableTool
            ? { maxAvailableTool: ToolSchemaMap[maxAvailableTool] }
            : {}),
        ...(creatorOverrides ? { creatorOverrides } : {}),
    });
};

export { handler };
