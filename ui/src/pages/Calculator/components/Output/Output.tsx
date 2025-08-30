import { ReactElement, useEffect, useState } from "react";
import {
    OutputUnit,
    AvailableTools,
    CreatorOverride,
} from "../../../../graphql/__generated__/graphql";
import { gql } from "../../../../graphql/__generated__";
import { useLazyQuery } from "@apollo/client/react";
import { useDebounce } from "use-debounce";
import { DEFAULT_DEBOUNCE, isUserError } from "../../utils";
import { Requirements, RequirementsSankey } from "./components";
import { LoadingMessage } from "./styles";
import { Target } from "../TargetInput";

type OutputProps = {
    itemName: string;
    target: Target;
    outputUnit: OutputUnit;
    onSelectedItemTotalChange: (target: Target) => void;
    maxAvailableTool?: AvailableTools;
    hasMachineTools?: boolean;
    creatorOverrides?: CreatorOverride[];
};

type ErrorMessageProps = {
    children: ReactElement | string;
};

const GET_CALCULATOR_OUTPUT = gql(`
    query GetCalculatorOutput($name: ID!, $workers: Int, $amount: Float, $unit: OutputUnit!, $maxAvailableTool: AvailableTools, $hasMachineTools: Boolean, $creatorOverrides: [CreatorOverride!]) {
        requirement(name: $name, workers: $workers, amount: $amount, maxAvailableTool: $maxAvailableTool, hasMachineTools: $hasMachineTools, creatorOverrides: $creatorOverrides, unit: $unit) {
            ... on Requirements {
                requirements {
                    name
                    amount
                    creators {
                        name
                        creator
                        workers
                        amount
                        demands {
                            name
                            amount
                        }
                    }
                }
            }
            ... on UserError {
                message
            }
        }
    }
`);

function ErrorMessage({ children }: ErrorMessageProps) {
    return <span role="alert">{children}</span>;
}

function UnhandledErrorMessage() {
    return (
        <ErrorMessage>
            An error occurred while calculating output, please change inputs and
            try again.
        </ErrorMessage>
    );
}

function Output({
    itemName,
    target,
    outputUnit,
    maxAvailableTool,
    hasMachineTools,
    creatorOverrides,
    onSelectedItemTotalChange,
}: OutputProps) {
    const [getCalculatorOutput, { loading, data, error }] = useLazyQuery(
        GET_CALCULATOR_OUTPUT,
    );
    const [debouncedTarget] = useDebounce(target, DEFAULT_DEBOUNCE);
    const [hasInvalidResponse, setHasInvalidResponse] = useState<boolean>();

    useEffect(() => {
        const creatorOverridesFilter =
            creatorOverrides && creatorOverrides.length > 0
                ? creatorOverrides
                : undefined;

        getCalculatorOutput({
            variables: {
                name: itemName,
                amount:
                    "amount" in debouncedTarget ? debouncedTarget.amount : null,
                workers:
                    "workers" in debouncedTarget
                        ? debouncedTarget.workers
                        : null,
                unit: outputUnit,
                maxAvailableTool,
                hasMachineTools,
                creatorOverrides: creatorOverridesFilter,
            },
        });
    }, [
        itemName,
        debouncedTarget,
        outputUnit,
        maxAvailableTool,
        hasMachineTools,
        creatorOverrides,
    ]);

    useEffect(() => {
        if (!data?.requirement || isUserError(data.requirement)) {
            return;
        }

        const selectedItemRequirements = data.requirement.requirements.find(
            ({ name }) => name === itemName,
        );

        if (!selectedItemRequirements) {
            setHasInvalidResponse(true);
            return;
        }

        setHasInvalidResponse(false);
        if ("amount" in target) {
            const totalWorkers = selectedItemRequirements.creators.reduce(
                (acc, { workers }) => {
                    return acc + workers;
                },
                0,
            );
            onSelectedItemTotalChange({ workers: totalWorkers });
        } else {
            onSelectedItemTotalChange({
                amount: selectedItemRequirements.amount,
            });
        }
    }, [data?.requirement]);

    if (hasInvalidResponse || error) {
        return <UnhandledErrorMessage />;
    }

    if (loading || !data?.requirement) {
        return <LoadingMessage>Calculating output...</LoadingMessage>;
    }

    if (isUserError(data.requirement)) {
        return <ErrorMessage>{data.requirement.message}</ErrorMessage>;
    }

    return (
        <>
            <Requirements requirements={data.requirement.requirements} />
            <RequirementsSankey
                requirements={data.requirement.requirements}
                selectedItemName={itemName}
            />
        </>
    );
}

export { Output };
