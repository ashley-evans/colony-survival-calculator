import React, { ReactElement, useEffect } from "react";
import {
    OutputUnit,
    AvailableTools,
    CreatorOverride,
} from "../../../../graphql/__generated__/graphql";
import { gql } from "../../../../graphql/__generated__";
import { useLazyQuery } from "@apollo/client";
import { useDebounce } from "use-debounce";
import { DEFAULT_DEBOUNCE, isUserError } from "../../utils";
import { OptimalOutput, Requirements } from "./components";
import { LoadingMessage } from "./styles";
import RequirementsSankey from "./components/RequirementsSankey";

type OptimalProps = {
    itemName: string;
    workers: number;
    outputUnit: OutputUnit;
    maxAvailableTool?: AvailableTools;
    hasMachineTools?: boolean;
    creatorOverrides?: CreatorOverride[];
};

type ErrorMessageProps = {
    children: ReactElement | string;
};

const GET_CALCULATOR_OUTPUT = gql(`
    query GetCalculatorOutput($name: ID!, $workers: Int!, $unit: OutputUnit!, $maxAvailableTool: AvailableTools, $hasMachineTools: Boolean, $outputCreator: String, $creatorOverrides: [CreatorOverride!]) {
        output(name: $name, workers: $workers, unit: $unit, maxAvailableTool: $maxAvailableTool, hasMachineTools: $hasMachineTools, creator: $outputCreator) {
            ... on OptimalOutput {
                amount
            }
            ... on UserError {
                message
            }
        }
        requirement(name: $name, workers: $workers, maxAvailableTool: $maxAvailableTool, hasMachineTools: $hasMachineTools, creatorOverrides: $creatorOverrides, unit: $unit) {
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

function Output({
    itemName,
    workers,
    outputUnit,
    maxAvailableTool,
    hasMachineTools,
    creatorOverrides,
}: OptimalProps) {
    const [getCalculatorOutput, { loading, data, error }] = useLazyQuery(
        GET_CALCULATOR_OUTPUT
    );
    const [debouncedWorkers] = useDebounce(workers, DEFAULT_DEBOUNCE);

    useEffect(() => {
        const creator = creatorOverrides
            ? creatorOverrides.find(({ itemName: item }) => item === itemName)
                  ?.creator
            : undefined;
        const creatorOverridesFilter =
            creatorOverrides && creatorOverrides.length > 0
                ? creatorOverrides
                : undefined;

        getCalculatorOutput({
            variables: {
                name: itemName,
                workers: debouncedWorkers,
                unit: outputUnit,
                maxAvailableTool,
                hasMachineTools,
                outputCreator: creator,
                creatorOverrides: creatorOverridesFilter,
            },
        });
    }, [
        itemName,
        debouncedWorkers,
        outputUnit,
        maxAvailableTool,
        hasMachineTools,
        creatorOverrides,
    ]);

    if (error) {
        return (
            <ErrorMessage>
                An error occurred while calculating output, please change
                item/workers/output unit and try again.
            </ErrorMessage>
        );
    }

    if (loading || !data?.output || !data.requirement) {
        return <LoadingMessage>Calculating output...</LoadingMessage>;
    }

    if (
        (isUserError(data.output) && isUserError(data.requirement)) ||
        isUserError(data.requirement)
    ) {
        return <ErrorMessage>{data.requirement.message}</ErrorMessage>;
    } else if (isUserError(data.output)) {
        return <ErrorMessage>{data.output.message}</ErrorMessage>;
    }

    return (
        <>
            <OptimalOutput amount={data.output.amount} unit={outputUnit} />
            <Requirements requirements={data.requirement.requirements} />
            <RequirementsSankey
                requirements={data.requirement.requirements}
                selectedItemName={itemName}
            />
        </>
    );
}

export { Output };
