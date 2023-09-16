import React, { ReactElement, useEffect } from "react";
import {
    OutputUnit,
    Tools,
    CreatorOverride,
} from "../../../../graphql/__generated__/graphql";
import { gql } from "../../../../graphql/__generated__";
import { useLazyQuery } from "@apollo/client";
import { useDebounce } from "use-debounce";
import { DEFAULT_DEBOUNCE, isUserError } from "../../utils";
import { OptimalOutput, Requirements } from "./components";
import { LoadingMessage } from "./styles";

type OptimalProps = {
    itemName: string;
    workers: number;
    outputUnit: OutputUnit;
    maxAvailableTool?: Tools;
    creatorOverrides?: CreatorOverride[];
};

type ErrorMessageProps = {
    children: ReactElement | string;
};

const GET_CALCULATOR_OUTPUT = gql(`
    query GetCalculatorOutput($name: ID!, $workers: Int!, $unit: OutputUnit!, $maxAvailableTool: Tools, $outputCreator: String, $creatorOverrides: [CreatorOverride!]) {
        output(name: $name, workers: $workers, unit: $unit, maxAvailableTool: $maxAvailableTool, creator: $outputCreator) {
            ... on OptimalOutput {
                amount
            }
            ... on UserError {
                message
            }
        }
        requirement(name: $name, workers: $workers, maxAvailableTool: $maxAvailableTool, creatorOverrides: $creatorOverrides, unit: $unit) {
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
                outputCreator: creator,
                creatorOverrides: creatorOverridesFilter,
            },
        });
    }, [
        itemName,
        debouncedWorkers,
        outputUnit,
        maxAvailableTool,
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
            <Requirements
                requirements={data.requirement.requirements}
                selectedItemName={itemName}
            />
        </>
    );
}

export { Output };
