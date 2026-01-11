import { AvailableToolsSchemaMap, OutputUnit, UserError } from "../../common";
import type {
    QueryRequirementArgs,
    RequirementResult,
} from "../../graphql/schema";
import type { GraphQLEventHandler } from "../../interfaces/GraphQLEventHandler";
import { queryRequirements } from "./domain/query-requirements";

const INVALID_OUTPUT_UNIT_ARGUMENT_ERROR =
    "Invalid arguments: Must provide output unit when querying amounts";
const INVALID_TARGET_ARGUMENT_ERROR =
    "Invalid arguments: Must provide either amount or workers when querying requirements (not both)";

const amountFields = new Set([
    "amount",
    "creators/amount",
    "creators/demands/amount",
]);

const isDefined = <T>(input: T | undefined | null): input is T => {
    return input !== undefined && input !== null;
};

const validateTargetInput = ({
    workers,
    amount,
}: Pick<QueryRequirementArgs, "workers" | "amount">):
    | { amount: number }
    | { workers: number } => {
    const isTargetWorkersDefined = isDefined(workers);
    const isTargetAmountDefined = isDefined(amount);
    if (isTargetWorkersDefined && isTargetAmountDefined) {
        throw new Error(INVALID_TARGET_ARGUMENT_ERROR);
    }

    if (isTargetWorkersDefined) {
        return { workers };
    }

    if (isTargetAmountDefined) {
        return { amount };
    }

    throw new Error(INVALID_TARGET_ARGUMENT_ERROR);
};

const handler: GraphQLEventHandler<
    QueryRequirementArgs,
    RequirementResult
> = async (event) => {
    const {
        id,
        unit,
        maxAvailableTool,
        creatorOverrides,
        hasMachineTools,
        locale,
        ...targetInputs
    } = event.arguments;
    const { selectionSetList } = event.info;

    const selectedAmountFields = selectionSetList.filter((value) =>
        amountFields.has(value),
    );

    if (selectedAmountFields.length > 0 && !unit) {
        throw new Error(INVALID_OUTPUT_UNIT_ARGUMENT_ERROR);
    }

    const validatedTarget = validateTargetInput(targetInputs);

    try {
        const requirements = await queryRequirements({
            id,
            ...validatedTarget,
            ...(unit ? { unit: OutputUnit[unit] } : {}),
            ...(maxAvailableTool
                ? {
                      maxAvailableTool:
                          AvailableToolsSchemaMap[maxAvailableTool],
                  }
                : {}),
            ...(hasMachineTools !== null && hasMachineTools !== undefined
                ? { hasMachineTools }
                : {}),
            ...(creatorOverrides ? { creatorOverrides } : {}),
            ...(locale ? { locale } : {}),
        });

        return {
            __typename: "Requirements",
            requirements,
        };
    } catch (ex) {
        if (ex instanceof UserError) {
            return {
                __typename: "UserError",
                code: ex.code,
                details: ex.details ? JSON.stringify(ex.details) : null,
            };
        }

        throw ex;
    }
};

export { handler };
